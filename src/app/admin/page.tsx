import db from '@/lib/db';

interface CountRow { count: number }
interface StatusRow { status: string; count: number }

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const planCount = (db.prepare('SELECT COUNT(*) as count FROM plans').get() as CountRow).count;
  const portfolioCount = (db.prepare('SELECT COUNT(*) as count FROM portfolio').get() as CountRow).count;
  const siteCount = (db.prepare('SELECT COUNT(*) as count FROM sites').get() as CountRow).count;
  const domainCount = (db.prepare('SELECT COUNT(*) as count FROM domains').get() as CountRow).count;
  const agentCount = (db.prepare('SELECT COUNT(*) as count FROM agents').get() as CountRow).count;

  const plansByStatus = db.prepare('SELECT status, COUNT(*) as count FROM plans GROUP BY status').all() as StatusRow[];
  const portfolioByStatus = db.prepare('SELECT status, COUNT(*) as count FROM portfolio GROUP BY status').all() as StatusRow[];
  const queuedPlans = (db.prepare("SELECT COUNT(*) as count FROM plans WHERE queue_status = 'queued'").get() as CountRow).count;

  const stats = [
    { label: 'Plans', value: planCount, color: 'text-accent' },
    { label: 'Portfolio Items', value: portfolioCount, color: 'text-accent-2' },
    { label: 'Sites', value: siteCount, color: 'text-accent-3' },
    { label: 'Domains', value: domainCount, color: 'text-blue-400' },
    { label: 'AI Agents', value: agentCount, color: 'text-purple-400' },
    { label: 'Queued Tasks', value: queuedPlans, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">rostandy.com admin overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-text-dim text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold text-text-primary mb-4">Plans by Status</h2>
          <div className="space-y-2">
            {plansByStatus.length === 0 ? (
              <p className="text-text-dim text-sm">No plans yet</p>
            ) : plansByStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <span className="text-text-muted capitalize">{s.status}</span>
                <span className="text-text-primary font-mono">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-semibold text-text-primary mb-4">Portfolio by Status</h2>
          <div className="space-y-2">
            {portfolioByStatus.length === 0 ? (
              <p className="text-text-dim text-sm">No items yet</p>
            ) : portfolioByStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <span className="text-text-muted capitalize">{s.status}</span>
                <span className="text-text-primary font-mono">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
