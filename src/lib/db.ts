import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'rostandy.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT UNIQUE NOT NULL,
    label TEXT DEFAULT '',
    role TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    steps TEXT DEFAULT '[]',
    status TEXT DEFAULT 'planned',
    priority TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'feature',
    queue_status TEXT DEFAULT 'idle',
    queue_result TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'project',
    tech_stack TEXT DEFAULT '',
    url TEXT DEFAULT '',
    github_url TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    status TEXT DEFAULT 'in-progress',
    plan_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'subdomain',
    url TEXT DEFAULT '',
    port INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    description TEXT DEFAULT '',
    config TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    registrar TEXT DEFAULT '',
    expiry_date TEXT DEFAULT '',
    nameservers TEXT DEFAULT '',
    dns_provider TEXT DEFAULT 'cloudflare',
    cloudflare_zone_id TEXT DEFAULT '',
    ssl_status TEXT DEFAULT 'unknown',
    mail_provider TEXT DEFAULT 'none',
    status TEXT DEFAULT 'active',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    system_prompt TEXT DEFAULT '',
    model TEXT DEFAULT 'gemini-2.5-flash',
    temperature REAL DEFAULT 0.7,
    tts_voice TEXT DEFAULT 'en_US-john-medium',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT '',
    category TEXT DEFAULT 'general',
    is_secret INTEGER DEFAULT 0,
    description TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS control_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command TEXT NOT NULL,
    response TEXT DEFAULT '',
    shell_commands TEXT DEFAULT '[]',
    shell_outputs TEXT DEFAULT '[]',
    model TEXT DEFAULT '',
    tokens_used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS control_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Bootstrap admin wallet
const walletCount = db.prepare('SELECT COUNT(*) as count FROM admin_wallets').get() as { count: number };
if (walletCount.count === 0 && process.env.ADMIN_WALLET) {
  db.prepare('INSERT OR IGNORE INTO admin_wallets (address, label, role) VALUES (?, ?, ?)').run(
    process.env.ADMIN_WALLET, 'Primary Admin', 'admin'
  );
}

// Seed default agent
const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
if (agentCount.count === 0) {
  db.prepare('INSERT INTO agents (name, description, system_prompt, model) VALUES (?, ?, ?, ?)').run(
    'Wendy Assistant',
    'Main AI assistant for rostandy.com visitors',
    'You are the AI assistant for Johannes Paulus Wendy Rostandy\'s portfolio website. You help visitors learn about Wendy\'s work, projects, and expertise. Be friendly, professional, and informative. Wendy is a Full-Stack Developer, AI Engineer, and Co-Founder of PT.PLUS Digital based in Jakarta, Indonesia. He specializes in machine learning, data engineering, web development, and AI automation.',
    'gemini-2.5-flash'
  );
}

// Seed default domain
const domainCount = db.prepare('SELECT COUNT(*) as count FROM domains').get() as { count: number };
if (domainCount.count === 0) {
  db.prepare('INSERT INTO domains (domain, registrar, dns_provider, status) VALUES (?, ?, ?, ?)').run(
    'rostandy.com', 'cloudflare', 'cloudflare', 'active'
  );
}

// Seed portfolio
const portfolioCount = db.prepare('SELECT COUNT(*) as count FROM portfolio').get() as { count: number };
if (portfolioCount.count === 0) {
  const projects = [
    ['Fairytale Library (Pustaka.org)', 'Multilingual children\'s story library with 10,000+ stories across 17 languages. Features AI-generated covers and story DNA extraction.', 'web-app', 'Express.js, EJS, SQLite, Replicate AI', 'https://pustaka.org', '', 'completed', 1],
    ['Tebakan.com', 'Full-stack prediction platform with Solana blockchain integration, admin dashboard, and documentation portal.', 'web-app', 'Next.js, TypeScript, Solana, Anchor', 'https://tebakan.com', '', 'completed', 2],
    ['Money Management Dashboard', 'Financial dashboard for loan calculation, debt payoff tracking, budgeting, and asset management.', 'web-app', 'React 19, Vite, Express, SQLite', 'https://money.ucok.org', '', 'completed', 3],
    ['Earth Live Dashboard', 'Real-time Earth monitoring dashboard with live data feeds and visualizations.', 'web-app', 'Next.js, TypeScript, APIs', 'https://live.ucok.org', '', 'completed', 4],
    ['MotoPortal', 'Motorcycle information portal and community platform.', 'web-app', 'Next.js, TypeScript, Tailwind', 'https://motoportal.ucok.org', '', 'completed', 5],
    ['Klinik Pintar', 'Smart clinic management system for healthcare workflows.', 'web-app', 'Next.js, TypeScript', 'https://klinik.ucok.org', '', 'completed', 6],
    ['2026 Travel Content', '365 daily "Top 10" travel articles for elementary-school children.', 'content', 'Python, AI Generation', '', '', 'in-progress', 7],
    ['PDF Classifier', 'CNN TensorFlow model for classifying PDF documents.', 'ml', 'Python, TensorFlow, CNN', '', 'https://github.com/jwendyr/pdfclassifier', 'completed', 8],
    ['Breast Cancer ML Classifier', 'Machine learning classification using Sklearn for breast cancer detection.', 'ml', 'Python, Sklearn, Pandas', '', 'https://github.com/jwendyr/machineLearning_breastCancer_Python', 'completed', 9],
    ['Ucok AI Server Admin', 'Central admin hub managing 16+ services, domain portfolio, and AI workflows.', 'devops', 'Next.js, TypeScript, SQLite, Solana Auth', 'https://ucok.org', '', 'completed', 10],
    ['PT.PLUS Digital', 'Co-founded digital solutions company in Jakarta, Indonesia.', 'business', 'Business Development, Technology', '', '', 'completed', 11],
    ['Bijaksana.org', 'Indonesian wisdom and knowledge platform.', 'web-app', 'Express.js, SQLite, Solana Auth', 'https://bijaksana.org', '', 'completed', 12],
  ];
  const insert = db.prepare('INSERT INTO portfolio (title, description, category, tech_stack, url, github_url, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const p of projects) insert.run(...p);
}

export default db;
