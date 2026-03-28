import { NextResponse } from "next/server"

import { getPublicSnapshot } from "@/lib/platform/service"

export async function GET() {
  const data = await getPublicSnapshot()
  return NextResponse.json(data)
}
