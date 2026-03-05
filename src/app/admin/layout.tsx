import Sidebar from '@/components/admin/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
