import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { DashboardClient } from "@/components/platform/dashboard-client"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth")
  }

  return (
    <main className="min-h-screen bg-[#071412] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Card className="mb-6 border-white/10 bg-card/60 text-card-foreground shadow-[0_24px_80px_rgba(4,18,16,0.32)] backdrop-blur">
          <CardContent className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Signed-in subscriber</p>
              <p className="text-lg font-semibold">{session.user.name}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link
                href="/"
                className="inline-flex h-10 items-center rounded-md border border-white/10 px-4 text-muted-foreground transition hover:bg-white/5 hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/admin"
                className="inline-flex h-10 items-center rounded-md border border-white/10 px-4 text-muted-foreground transition hover:bg-white/5 hover:text-white"
              >
                Admin
              </Link>
            </div>
          </CardContent>
        </Card>
        <DashboardClient />
      </div>
    </main>
  )
}
