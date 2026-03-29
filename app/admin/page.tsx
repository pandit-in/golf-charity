import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminClient } from "@/components/platform/admin-client"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth"

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth")
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Signed-in operator</p>
              <p className="text-lg font-semibold">{session.user.name}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground inline-flex h-10 items-center rounded-md border px-4 transition hover:bg-muted"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground inline-flex h-10 items-center rounded-md border px-4 transition hover:bg-muted"
              >
                Subscriber
              </Link>
            </div>
          </CardContent>
        </Card>
        <AdminClient />
      </div>
    </main>
  )
}
