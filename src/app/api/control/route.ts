import { NextRequest, NextResponse } from 'next/server';
import { execFileSync } from 'child_process';
import db from '@/lib/db';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

interface MemoryRow { key: string; value: string }
interface LogRow { id: number; command: string; response: string; created_at: string }

const SYSTEM_PROMPT = `You are the autonomous control agent for rostandy.com. You execute commands without asking questions.

## Site Architecture
- **rostandy.com** — Next.js 14, TypeScript, Tailwind, SQLite, PM2 port 3015
- **Location**: /home/rostandy (source), /home/ucokadmin/japri/backend (AI backend)
- **Auth**: Solana wallet + JWT (Phantom Devnet)
- **Chat**: Proxied through japri.com (NestJS, port 3100) with 15 language agents
- **DB**: /home/rostandy/data/rostandy.db (SQLite: plans, portfolio, sites, domains, agents, settings, admin_wallets, control_logs, control_memory)
- **Admin**: /admin with Dashboard, Plans, Portfolio, Sites, Domains, Agents, Wallets, Settings, Control

## Server
- Hetzner VPS (178.156.182.1), Ubuntu 24.04, HestiaCP, 7.6GB RAM, 4-core AMD EPYC
- PM2 manages all Node services (run as root)
- Nginx reverse proxy, Cloudflare DNS (Full SSL)
- Key services: ucok-portfolio (3001), bijaksana-api (3002), travel-ucok (3003), money-api (3005), fairytale-web (3008), japri-api (3100), rostandy (3015)

## Japri AI Platform
- DB-backed AI agents in PostgreSQL ai_agents table
- 15 Rostandy language agents (rostandy, rostandy-id, rostandy-ja, etc.)
- Public API: GET /api/public/agent/:slug, POST /api/public/chat
- Piper TTS per language, OpenRouter fallback when Gemini quota exceeded

## Key Files
- /home/rostandy/src/app/ — Next.js pages and API routes
- /home/rostandy/src/lib/db.ts — SQLite schema and seeding
- /home/rostandy/src/components/ — React components
- /home/rostandy/.env — Environment variables
- /home/ucokadmin/japri/backend/src/chat/ai-agent.service.ts — Japri AI agent service

## Rules
1. Execute commands immediately. Never ask for clarification.
2. When you need to run shell commands, use the execute_shell tool.
3. Be concise. Report what you did, not what you plan to do.
4. For file edits, show the exact changes made.
5. For dangerous operations (delete, drop, force-push), warn but still execute if clearly intended.
6. You have full server access. Use it wisely.`;

function getMemory(): string {
  const rows = db.prepare('SELECT key, value FROM control_memory ORDER BY key').all() as MemoryRow[];
  if (rows.length === 0) return '';
  return '\n\n## Agent Memory\n' + rows.map(r => `- **${r.key}**: ${r.value}`).join('\n');
}

function getRecentLogs(): string {
  const rows = db.prepare('SELECT command, response, created_at FROM control_logs ORDER BY id DESC LIMIT 5').all() as LogRow[];
  if (rows.length === 0) return '';
  return '\n\n## Recent Commands\n' + rows.reverse().map(r =>
    `[${r.created_at}] > ${r.command}\n${r.response?.substring(0, 200)}`
  ).join('\n\n');
}

function executeShell(cmd: string): string {
  try {
    // Use bash -c to support pipes, redirects, etc. Input is from authenticated admin only.
    const output = execFileSync('/bin/bash', ['-c', cmd], {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
      encoding: 'utf-8',
      cwd: '/home/rostandy',
      env: { ...process.env, PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.local/bin' },
    });
    return output.trim();
  } catch (err: unknown) {
    const e = err as { stderr?: string; stdout?: string; message?: string };
    return `ERROR: ${e.stderr || e.stdout || e.message || 'Command failed'}`.trim();
  }
}

async function callClaude(command: string, fullPrompt: string): Promise<{ reply: string; model: string; shellCommands: string[]; shellOutputs: string[] }> {
  const shellCommands: string[] = [];
  const shellOutputs: string[] = [];

  // Try Anthropic Claude first
  if (ANTHROPIC_API_KEY) {
    try {
      const messages: { role: string; content: unknown }[] = [
        { role: 'user', content: command },
      ];

      let reply = '';
      let model = 'claude-opus-4-6';

      // Loop for tool use (up to 10 rounds)
      for (let i = 0; i < 10; i++) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            system: fullPrompt,
            tools: [{
              name: 'execute_shell',
              description: 'Execute a shell command on the server. Use for file operations, service management, git, npm, pm2, curl, etc.',
              input_schema: {
                type: 'object' as const,
                properties: {
                  command: { type: 'string' as const, description: 'The shell command to execute' },
                },
                required: ['command'],
              },
            }, {
              name: 'save_memory',
              description: 'Save a key-value pair to persistent agent memory for future reference.',
              input_schema: {
                type: 'object' as const,
                properties: {
                  key: { type: 'string' as const, description: 'Memory key (e.g. "last_deploy_date")' },
                  value: { type: 'string' as const, description: 'Memory value' },
                },
                required: ['key', 'value'],
              },
            }],
            messages,
          }),
          signal: AbortSignal.timeout(120000),
        });

        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 401 || res.status === 403 || res.status === 429) break;
          throw new Error(`Claude ${res.status}: ${errText.substring(0, 300)}`);
        }

        const data = await res.json();
        model = data.model || model;

        // Process response blocks
        const textParts: string[] = [];
        let hasToolUse = false;
        const toolResults: { type: string; tool_use_id: string; content: string }[] = [];

        for (const block of data.content) {
          if (block.type === 'text') {
            textParts.push(block.text);
          } else if (block.type === 'tool_use') {
            hasToolUse = true;
            if (block.name === 'execute_shell') {
              const cmd = block.input.command;
              shellCommands.push(cmd);
              const output = executeShell(cmd);
              shellOutputs.push(output);
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: output.substring(0, 10000) || '(no output)' });
            } else if (block.name === 'save_memory') {
              db.prepare('INSERT OR REPLACE INTO control_memory (key, value, updated_at) VALUES (?, ?, datetime("now"))').run(block.input.key, block.input.value);
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: `Saved: ${block.input.key}` });
            }
          }
        }

        if (textParts.length > 0) reply += (reply ? '\n' : '') + textParts.join('\n');

        if (!hasToolUse || data.stop_reason === 'end_turn') break;

        // Continue conversation with tool results
        messages.push({ role: 'assistant', content: data.content });
        messages.push({ role: 'user', content: toolResults as unknown as string });
      }

      return { reply, model, shellCommands, shellOutputs };
    } catch (err: unknown) {
      console.error('Claude error:', err);
    }
  }

  // Fallback: OpenRouter (no shell execution)
  if (OPENROUTER_API_KEY) {
    const modelsToTry = ['google/gemini-2.5-flash', 'openrouter/free'];
    for (const orModel of modelsToTry) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: orModel,
            messages: [
              { role: 'system', content: fullPrompt + '\n\nNOTE: Shell execution unavailable in fallback mode. Provide commands for the user to run manually.' },
              { role: 'user', content: command },
            ],
            max_tokens: 2048,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) {
          if (res.status === 402 || res.status === 429) continue;
          break;
        }

        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || 'No response';
        return { reply: `[Fallback mode — no shell execution]\n\n${reply}`, model: orModel, shellCommands, shellOutputs };
      } catch { continue; }
    }
  }

  return { reply: 'No AI provider available. Set ANTHROPIC_API_KEY for full control.', model: 'none', shellCommands, shellOutputs };
}

export async function POST(request: NextRequest) {
  const { command } = await request.json();
  if (!command?.trim()) {
    return NextResponse.json({ error: 'Command required' }, { status: 400 });
  }

  const fullPrompt = SYSTEM_PROMPT + getMemory() + getRecentLogs();
  const { reply, model, shellCommands, shellOutputs } = await callClaude(command.trim(), fullPrompt);

  db.prepare('INSERT INTO control_logs (command, response, shell_commands, shell_outputs, model) VALUES (?, ?, ?, ?, ?)').run(
    command.trim(),
    reply,
    JSON.stringify(shellCommands),
    JSON.stringify(shellOutputs),
    model,
  );

  return NextResponse.json({ reply, model, shellCommands, shellOutputs });
}

export async function GET() {
  const logs = db.prepare('SELECT id, command, response, model, shell_commands, shell_outputs, created_at FROM control_logs ORDER BY id DESC LIMIT 50').all();
  const memory = db.prepare('SELECT key, value, updated_at FROM control_memory ORDER BY key').all();
  return NextResponse.json({ logs, memory });
}

export async function DELETE(request: NextRequest) {
  const { action, key } = await request.json();
  if (action === 'clear-logs') {
    db.prepare('DELETE FROM control_logs').run();
    return NextResponse.json({ success: true });
  }
  if (action === 'delete-memory' && key) {
    db.prepare('DELETE FROM control_memory WHERE key = ?').run(key);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
