# rostandy.com — Build Plan

## Phase 1: Foundation (Minimal Viable Site)
- [x] Step 1: Project structure, package.json, configs (tsconfig, tailwind, postcss, next.config)
- [x] Step 2: Core libraries — database (SQLite), auth (JWT + Solana wallet), middleware
- [x] Step 3: Auth API routes (challenge, verify, logout, session)
- [x] Step 4: WalletProvider, login page, admin layout + sidebar
- [x] Step 5: All admin pages (Dashboard, Plans, Portfolio, Sites, Domains, Agents, Settings)
- [x] Step 6: All API routes (plans, portfolio, sites, domains, agents, settings, chat)
- [x] Step 7: Public portfolio page (landing/resume)
- [x] Step 8: Public chat page with Gemini 2.5 integration
- [x] Step 9: npm install (copied node_modules from ucok-portfolio) + build + verify
- [x] Step 10: PM2 setup on port 3015 — RUNNING

## Phase 2: Domain & Infrastructure
- [x] Step 11: Nginx proxy config for rostandy.com (nodejs-3015 template + SSL conf)
- [x] Step 12: Cloudflare DNS setup (A records proxied, zone 42c353f4b28ec5fa6eb4b2299bd822cd)
- [x] Step 13: SSL certificate (self-signed 10yr, CF Full mode)
- [x] Step 14: Port registry updated (domain, path, nginx_conf fields)
- [x] Step 15: Git init + push to GitHub (jwendyr/rostandy)

## Phase 3: Piper TTS Integration
- [x] Step 16: Install Piper TTS binary (/opt/piper) + John voice model (/opt/piper/voices)
- [x] Step 17: TTS API endpoint (/api/chat with piper, /api/chat/audio serving WAV)
- [x] Step 18: Audio playback in chat UI (auto-play + replay button)
- [x] Step 19: Auto language detection from Accept-Language header (23 languages, auto TTS voice selection)

## Phase 4: Enhanced Admin Features
- [ ] Step 20: Plan execution queue — background agent integration
- [ ] Step 21: Domain Cloudflare API integration (DNS records, zone info, expiry)
- [ ] Step 22: Settings .env sync with validation
- [ ] Step 23: Agent prompt testing (send test message from admin)
- [ ] Step 24: Portfolio auto-image generation (placeholder covers)

## Phase 5: Public Site Polish
- [ ] Step 25: Animated scroll reveals on portfolio page
- [ ] Step 26: SEO metadata, Open Graph tags, structured data
- [ ] Step 27: Mobile responsive refinements
- [ ] Step 28: Favicon, touch icons, manifest.json
- [ ] Step 29: Analytics integration
- [ ] Step 30: Performance optimization (lazy loading, image optimization)

## Status
- **Current Phase**: 3 COMPLETE — Phase 4 next
- **Live URL**: https://rostandy.com
- **GitHub**: https://github.com/jwendyr/rostandy
- **Port**: 3015
- **PM2**: rostandy (online)
- **CF Zone**: 42c353f4b28ec5fa6eb4b2299bd822cd
- **Wallet**: 9ixfhJavkbZKGHUAHYYKmD6bG8av4YgTdzwq7NU1MEfA (Phantom devnet)
- **Piper TTS**: /opt/piper/piper, John voice at /opt/piper/voices/en_US-john-medium.onnx
- **Action needed**: Set Cloudflare SSL mode to "Full"
