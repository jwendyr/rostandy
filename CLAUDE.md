# rostandy.com

Personal portfolio & admin hub for Johannes Paulus Wendy Rostandy.

## Stack
- **Framework**: Next.js 14, TypeScript, Tailwind CSS, App Router
- **DB**: SQLite (better-sqlite3) at `data/rostandy.db`
- **Auth**: Solana wallet (Phantom Devnet) + JWT via `jose`
- **PM2**: `rostandy`, port 3015
- **URL**: https://rostandy.com
- **Location**: /home/rostandy

## Server
- Hetzner VPS (178.156.182.1), Ubuntu 24.04, HestiaCP
- 7.6GB RAM, 4-core AMD EPYC, PM2 manages all Node services (as root)
- Nginx reverse proxy, Cloudflare DNS (Full SSL)
- Admin wallet: `9ixfhJavkbZKGHUAHYYKmD6bG8av4YgTdzwq7NU1MEfA`

## Key Services on This Server
| Service | Port | Domain |
|---------|------|--------|
| rostandy | 3015 | rostandy.com |
| ucok-portfolio | 3001 | ucok.org |
| bijaksana-api | 3002 | bijaksana.org |
| travel-ucok | 3003 | travel.ucok.org |
| money-api | 3005 | money.ucok.org |
| fairytale-web | 3008 | pustaka.org |
| klinik-pintar | 3010 | klinik.ucok.org |
| motoportal | 3012 | motoportal.ucok.org |
| earth-dashboard | 3020 | live.ucok.org |
| japri-api | 3100 | japri.com (AI backend) |
| tebakan-app | 4050 | tebakan.com |

## Database Tables
`admin_wallets`, `plans`, `portfolio`, `sites`, `domains`, `agents`, `settings`, `chat_messages`, `control_logs`, `control_memory`

## Admin Pages (/admin/*)
Dashboard, Plans, Portfolio, Sites, Domains, Agents, Wallets, Control (terminal), Settings

## Chat System
- Proxied through japri.com NestJS backend (port 3100)
- 15 language-specific agents (rostandy, rostandy-id, rostandy-ja, etc.)
- Piper TTS per language, OpenRouter fallback

## Key Files
- `src/app/` — Next.js pages and API routes
- `src/lib/db.ts` — SQLite schema and seeding
- `src/lib/auth.ts` — Solana wallet JWT auth
- `src/components/` — React components
- `src/middleware.ts` — Route protection
- `terminal-server.js` — WebSocket terminal server (port 3016)
- `.env` — Environment variables (never commit)

## Domain Management
- Use `/home/ucok/ai-tools/bin/port-enforce` for port registry
- Nginx SSL configs in `/etc/nginx/conf.d/domains/`
- HestiaCP for domain setup, self-signed SSL (Cloudflare handles real SSL)
- Add-domain workflow: Cloudflare DNS → HestiaCP → nginx template → SSL cert → proxy conf

## Build & Deploy
```bash
# Stop services to free RAM before build
pm2 stop fairytale-web travel-ucok ucok-portfolio
NODE_OPTIONS="--max-old-space-size=1024" npm run build
pm2 restart rostandy
pm2 start fairytale-web travel-ucok ucok-portfolio
```

## Git
- Remote: git@github.com:jwendyr/rostandy.git (SSH auth)
- Branch: main
