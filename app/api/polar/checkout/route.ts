import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { createAuthenticatedPolarCheckoutUrl } from "@/lib/polar/client"

const checkoutSchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
})

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { message: "Sign in first to continue to checkout." },
        { status: 401 },
      )
    }

    const body = checkoutSchema.parse(await request.json())
    const result = await createAuthenticatedPolarCheckoutUrl({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      plan: body.plan,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create checkout.",
      },
      { status: 500 },
    )
  }
}
