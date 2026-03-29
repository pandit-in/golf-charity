import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { getOrCreateDashboardSnapshotForAuthUser } from "@/lib/platform/service"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const data = await getOrCreateDashboardSnapshotForAuthUser({
    authUserId: session.user.id,
    name: session.user.name,
    email: session.user.email,
  })

  return NextResponse.json(data)
}
