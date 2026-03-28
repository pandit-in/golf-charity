import Link from "next/link"

import { DashboardClient } from "@/components/platform/dashboard-client"

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#071412] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/55">Demo subscriber</p>
            <p className="text-lg font-semibold">Avery Collins</p>
          </div>
          <div className="flex gap-3 text-sm text-white/70">
            <Link href="/" className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/5">Home</Link>
            <Link href="/admin" className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/5">Admin</Link>
          </div>
        </div>
        <DashboardClient />
      </div>
    </main>
  )
}
