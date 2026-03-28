import { NextResponse } from "next/server"

import { getAdminSnapshot } from "@/lib/platform/service"

export async function GET() {
  const data = await getAdminSnapshot()
  return NextResponse.json(data)
}
