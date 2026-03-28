import Link from "next/link"

import { AdminClient } from "@/components/platform/admin-client"

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Demo admin</p>
            <p className="text-lg font-semibold text-slate-950">Maya Reynolds</p>
          </div>
          <div className="flex gap-3 text-sm text-slate-600">
            <Link href="/" className="rounded-full border border-slate-200 px-4 py-2 hover:bg-slate-50">Home</Link>
            <Link href="/dashboard" className="rounded-full border border-slate-200 px-4 py-2 hover:bg-slate-50">Subscriber</Link>
          </div>
        </div>
        <AdminClient />
      </div>
    </main>
  )
}
