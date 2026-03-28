import { NextRequest, NextResponse } from "next/server"

import { getDashboardSnapshot } from "@/lib/platform/service"

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? "user-avery"
  const data = await getDashboardSnapshot(userId)
  return NextResponse.json(data)
}
