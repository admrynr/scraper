import DashboardNavbar from '@/components/DashboardNavbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <DashboardNavbar />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
