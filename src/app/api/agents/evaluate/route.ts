import { NextRequest, NextResponse } from 'next/server';
import { execFileSync } from 'child_process';
import db from '@/lib/db';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

interface AgentRow {
  id: number;
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  updated_at: string;
}

function gatherContext(): string {
  // Get current file tree
  let fileTree = '';
  try {
    fileTree = execFileSync('/bin/bash', ['-c', 'find /home/rostandy/src -type f -name "*.ts" -o -name "*.tsx" | sort'], {
      timeout: 5000, encoding: 'utf-8', maxBuffer: 64 * 1024,
    }).trim();
  } catch { fileTree = '(unable to scan)'; }

  // Get DB tables info
  let tables = '';
  try {
    const tableList = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
    tables = tableList.map(t => {
      const cols = db.prepare(`PRAGMA table_info(${t.name})`).all() as { name: string; type: string }[];
      return `${t.name}: ${cols.map(c => c.name).join(', ')}`;
    }).join('\n');
  } catch { tables = '(unable to read)'; }

  // Get PM2 services
  let pm2 = '';
  try {
    pm2 = execFileSync('/bin/bash', ['-c', 'pm2 jlist 2>/dev/null | node -e "const d=JSON.parse(require(\'fs\').readFileSync(\'/dev/stdin\',\'utf8\')); d.forEach(p=>console.log(p.name+\' [\'+p.pm2_env.status+\'] port:\'+((p.pm2_env.env||{}).PORT||\'-\')))"'], {
      timeout: 5000, encoding: 'utf-8', maxBuffer: 64 * 1024,
    }).trim();
  } catch { pm2 = '(unable to read)'; }

  // Get package.json deps
  let deps = '';
  try {
    deps = execFileSync('/bin/bash', ['-c', 'node -e "const p=require(\'/home/rostandy/package.json\'); console.log(Object.keys(p.dependencies||{}).join(\', \'))"'], {
      timeout: 5000, encoding: 'utf-8', maxBuffer: 64 * 1024,
    }).trim();
  } catch { deps = '(unable to read)'; }

  // Get recent git log
  let gitLog = '';
  try {
    gitLog = execFileSync('/bin/bash', ['-c', 'cd /home/rostandy && git log --oneline -10 2>/dev/null'], {
      timeout: 5000, encoding: 'utf-8', maxBuffer: 64 * 1024,
    }).trim();
  } catch { gitLog = '(no git history)'; }

  // Get other agents for cross-reference
  const allAgents = db.prepare('SELECT name, description, model FROM agents').all() as { name: string; description: string; model: string }[];
  const agentList = allAgents.map(a => `- ${a.name} (${a.model}): ${a.description}`).join('\n');

  return `## Current Source Files\n${fileTree}\n\n## Database Tables\n${tables}\n\n## PM2 Services\n${pm2}\n\n## Dependencies\n${deps}\n\n## Recent Git Commits\n${gitLog}\n\n## All Agents\n${agentList}`;
}

export async function POST(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as AgentRow | undefined;
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const context = gatherContext();

  const evaluationPrompt = `You are a prompt engineering expert. Evaluate the following AI agent's system prompt against the current state of the project it serves.

## Agent: ${agent.name}
## Description: ${agent.description}
## Model: ${agent.model}
## Last Updated: ${agent.updated_at}

## Current System Prompt:
${agent.system_prompt}

## Current Project State:
${context}

## Your Task:
Analyze the agent's system prompt and provide:

1. **Accuracy Score** (0-100): How accurately does the prompt reflect the current state of the project?
2. **Missing Information**: What has changed or been added since the prompt was written that it doesn't cover?
3. **Outdated Information**: What does the prompt mention that is no longer accurate?
4. **Relevance Score** (0-100): How well-suited is the prompt for the agent's described purpose?
5. **Specific Suggestions**: Concrete changes to improve the prompt (additions, removals, modifications)
6. **Suggested Prompt Update**: If the scores are below 90, provide an updated version of the system prompt that addresses all issues.

Be specific and actionable. Reference actual files, tables, and services from the project state.`;

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'No AI provider available (OPENROUTER_API_KEY not set)' }, { status: 503 });
  }

  const modelsToTry = ['google/gemini-2.5-flash', 'openrouter/free'];

  for (const model of modelsToTry) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'user', content: evaluationPrompt },
          ],
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        if (res.status === 402 || res.status === 429) continue;
        break;
      }

      const data = await res.json();
      const evaluation = data?.choices?.[0]?.message?.content?.trim() || 'No evaluation generated';

      return NextResponse.json({
        evaluation,
        model: data?.model || model,
        agent: agent.name,
        context_summary: {
          files: context.split('\n').filter(l => l.endsWith('.ts') || l.endsWith('.tsx')).length,
          tables: context.match(/^[a-z_]+:/gm)?.length || 0,
        },
      });
    } catch { continue; }
  }

  return NextResponse.json({ error: 'AI evaluation failed — all providers unavailable' }, { status: 503 });
}
