import Sidebar from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}
