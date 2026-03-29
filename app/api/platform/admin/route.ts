import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { getAdminSnapshot, syncAuthUsersToPlatformStore } from "@/lib/platform/service"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const authUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)

  await syncAuthUsersToPlatformStore(authUsers)
  const data = await getAdminSnapshot()
  return NextResponse.json(data)
}
