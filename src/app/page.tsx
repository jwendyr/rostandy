import db from '@/lib/db';
import Link from 'next/link';

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  category: string;
  tech_stack: string;
  url: string;
  github_url: string;
  status: string;
  sort_order: number;
}

const categoryLabels: Record<string, string> = {
  'web-app': 'Web Application',
  'ml': 'Machine Learning',
  'content': 'Content',
  'devops': 'DevOps & Infrastructure',
  'business': 'Business',
};

const statusColors: Record<string, string> = {
  'completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'planned': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const skills = [
  { name: 'TypeScript', level: 95 },
  { name: 'React / Next.js', level: 95 },
  { name: 'Python', level: 90 },
  { name: 'Node.js / Express', level: 90 },
  { name: 'Machine Learning', level: 85 },
  { name: 'SQLite / PostgreSQL', level: 85 },
  { name: 'Solana / Web3', level: 80 },
  { name: 'TensorFlow / PyTorch', level: 80 },
  { name: 'Docker / Linux / DevOps', level: 85 },
  { name: 'AI Automation & LLMs', level: 90 },
];

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const projects = db.prepare('SELECT * FROM portfolio ORDER BY sort_order ASC').all() as PortfolioItem[];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-bg/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold gradient-text">WR</span>
          <div className="flex items-center gap-6">
            <a href="#about" className="text-text-muted hover:text-text-primary text-sm transition-colors">About</a>
            <a href="#projects" className="text-text-muted hover:text-text-primary text-sm transition-colors">Projects</a>
            <a href="#skills" className="text-text-muted hover:text-text-primary text-sm transition-colors">Skills</a>
            <Link href="/chat" className="btn-primary text-xs">Chat with AI</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-accent font-mono text-sm mb-4">Hi, I&apos;m</p>
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="gradient-text">Wendy Rostandy</span>
            </h1>
            <p className="text-2xl md:text-3xl text-text-muted font-light mb-6">
              Full-Stack Developer & AI Engineer
            </p>
            <p className="text-text-muted leading-relaxed max-w-xl mb-8">
              Building intelligent systems at the intersection of web development, machine learning, and automation.
              Co-Founder of PT.PLUS Digital. Based in Jakarta, Indonesia.
            </p>
            <div className="flex items-center gap-4">
              <a href="#projects" className="btn-primary">View Projects</a>
              <Link href="/chat" className="btn-secondary">Talk to My AI</Link>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 gradient-text">About</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4 text-text-muted leading-relaxed">
              <p>
                I&apos;m <strong className="text-text-primary">Johannes Paulus Wendy Rostandy</strong>, a full-stack developer
                and AI engineer with deep expertise in building production systems that leverage modern web technologies
                and machine learning.
              </p>
              <p>
                As Co-Founder of <strong className="text-text-primary">PT.PLUS Digital</strong> in Jakarta, I lead technology
                strategy and business development for digital transformation solutions.
              </p>
              <p>
                My work spans from multilingual content platforms serving thousands of stories to financial dashboards,
                blockchain-integrated applications, and AI-powered automation systems managing complex server infrastructure.
              </p>
            </div>
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-text-primary">Quick Facts</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-text-dim">Location</span><span className="text-text-primary">Jakarta, Indonesia</span></div>
                <div className="flex justify-between"><span className="text-text-dim">Education</span><span className="text-text-primary">Universitas Pelita Harapan</span></div>
                <div className="flex justify-between"><span className="text-text-dim">Company</span><span className="text-text-primary">PT.PLUS Digital (Co-Founder)</span></div>
                <div className="flex justify-between"><span className="text-text-dim">Focus</span><span className="text-text-primary">AI, Full-Stack, ML, Web3</span></div>
                <div className="flex justify-between"><span className="text-text-dim">Active Projects</span><span className="text-accent">{projects.filter(p => p.status === 'in-progress').length}+ ongoing</span></div>
                <div className="flex justify-between"><span className="text-text-dim">Completed</span><span className="text-emerald-400">{projects.filter(p => p.status === 'completed').length} projects</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 gradient-text">Projects & Portfolio</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="glass-card p-6 flex flex-col hover:border-accent/30 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-text-dim font-mono">{categoryLabels[project.category] || project.category}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[project.status] || 'text-text-dim'}`}>
                    {project.status}
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary mb-2 group-hover:text-accent transition-colors">{project.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed flex-1 mb-4">{project.description}</p>
                {project.tech_stack && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tech_stack.split(', ').map((tech) => (
                      <span key={tech} className="text-[10px] px-2 py-0.5 rounded bg-accent/5 text-accent border border-accent/10">{tech}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 mt-auto">
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                      Live Site &rarr;
                    </a>
                  )}
                  {project.github_url && (
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-text-muted hover:text-text-primary">
                      GitHub &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 gradient-text">Skills & Expertise</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
            {skills.map((skill) => (
              <div key={skill.name} className="glass-card p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-text-primary">{skill.name}</span>
                  <span className="text-xs text-text-dim font-mono">{skill.level}%</span>
                </div>
                <div className="w-full bg-bg rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-accent to-accent-2 h-1.5 rounded-full transition-all" style={{ width: `${skill.level}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-text-dim text-sm">
            &copy; {new Date().getFullYear()} Johannes Paulus Wendy Rostandy
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/jwendyr" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary text-sm transition-colors">GitHub</a>
            <Link href="/chat" className="text-text-muted hover:text-text-primary text-sm transition-colors">AI Chat</Link>
            <Link href="/login" className="text-text-dim hover:text-text-muted text-xs transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
