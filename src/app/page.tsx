import db from '@/lib/db';
import Link from 'next/link';
import { headers } from 'next/headers';
import Nav from '@/components/Nav';
import { detectLocaleFromHeader, t as getT, isRTL } from '@/lib/i18n';

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

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  planned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
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

export default async function HomePage() {
  const h = await headers();
  const locale = detectLocaleFromHeader(h.get('accept-language'));
  const t = getT(locale);
  const rtl = isRTL(locale);
  const projects = db.prepare('SELECT * FROM portfolio ORDER BY sort_order ASC').all() as PortfolioItem[];

  return (
    <div className="min-h-screen" dir={rtl ? 'rtl' : undefined}>
      <Nav t={t} />

      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-accent font-mono text-xs sm:text-sm mb-3 sm:mb-4">{t.hero.greeting}</p>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-bold mb-3 sm:mb-4 leading-tight">
              <span className="gradient-text">Wendy Rostandy</span>
            </h1>
            <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl text-text-muted font-light mb-4 sm:mb-6">
              {t.hero.title}
            </p>
            <p className="text-text-muted leading-relaxed max-w-xl mb-6 sm:mb-8 text-sm sm:text-base">
              {t.hero.description}
            </p>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4">
              <a href="#projects" className="btn-primary text-center">{t.hero.viewProjects}</a>
              <Link href="/chat" className="btn-secondary text-center">{t.hero.talkToAI}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 gradient-text">{t.about.heading}</h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-4 text-text-muted leading-relaxed text-sm sm:text-base">
              <p>
                <strong className="text-text-primary">{t.about.bio1.split(',')[0]},</strong>
                {t.about.bio1.substring(t.about.bio1.indexOf(',') + 1)}
              </p>
              <p>{t.about.bio2}</p>
              <p>{t.about.bio3}</p>
            </div>
            <div className="glass-card p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-text-primary text-sm sm:text-base">{t.about.quickFacts}</h3>
              <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between gap-2"><span className="text-text-dim shrink-0">{t.about.location}</span><span className="text-text-primary text-end">Jakarta, Indonesia</span></div>
                <div className="flex justify-between gap-2"><span className="text-text-dim shrink-0">{t.about.education}</span><span className="text-text-primary text-end">Universitas Pelita Harapan</span></div>
                <div className="flex justify-between gap-2"><span className="text-text-dim shrink-0">{t.about.company}</span><span className="text-text-primary text-end">PT.PLUS Digital</span></div>
                <div className="flex justify-between gap-2"><span className="text-text-dim shrink-0">{t.about.focus}</span><span className="text-text-primary text-end">AI, Full-Stack, ML, Web3</span></div>
                <div className="flex justify-between gap-2"><span className="text-text-dim shrink-0">{t.about.activeProjects}</span><span className="text-accent">{projects.filter(p => p.status === 'in-progress').length}+ {t.about.ongoing}</span></div>
                <div className="flex justify-between gap-2"><span className="text-text-dim shrink-0">{t.about.completed}</span><span className="text-emerald-400">{projects.filter(p => p.status === 'completed').length} {t.about.projects}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 gradient-text">{t.proj.heading}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <div key={project.id} className="glass-card p-4 sm:p-6 flex flex-col hover:border-accent/30 transition-colors group">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <span className="text-[10px] sm:text-xs text-text-dim font-mono">{t.categories[project.category] || project.category}</span>
                  <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full border whitespace-nowrap ${statusColors[project.status] || 'text-text-dim'}`}>
                    {t.status[project.status as keyof typeof t.status] || project.status}
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary mb-1.5 sm:mb-2 text-sm sm:text-base group-hover:text-accent transition-colors">{project.title}</h3>
                <p className="text-text-muted text-xs sm:text-sm leading-relaxed flex-1 mb-3 sm:mb-4">{project.description}</p>
                {project.tech_stack && (
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
                    {project.tech_stack.split(', ').map((tech) => (
                      <span key={tech} className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-accent/5 text-accent border border-accent/10">{tech}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 mt-auto">
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                      {t.proj.liveSite} &rarr;
                    </a>
                  )}
                  {project.github_url && (
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-text-muted hover:text-text-primary">
                      {t.proj.github} &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 gradient-text">{t.skills.heading}</h2>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-4xl">
            {skills.map((skill) => (
              <div key={skill.name} className="glass-card p-3 sm:p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs sm:text-sm text-text-primary">{skill.name}</span>
                  <span className="text-[10px] sm:text-xs text-text-dim font-mono">{skill.level}%</span>
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
      <footer className="border-t border-border py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-text-dim text-xs sm:text-sm text-center sm:text-start">
            &copy; {new Date().getFullYear()} Johannes Paulus Wendy Rostandy
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="https://github.com/jwendyr" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary text-xs sm:text-sm transition-colors">GitHub</a>
            <Link href="/chat" className="text-text-muted hover:text-text-primary text-xs sm:text-sm transition-colors">{t.footer.aiChat}</Link>
            <Link href="/login" className="text-text-dim hover:text-text-muted text-xs transition-colors">{t.footer.admin}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
