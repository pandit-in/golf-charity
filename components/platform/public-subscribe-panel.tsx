"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import type { Charity } from "@/lib/platform/types"

export function PublicSubscribePanel({ charities }: { charities: Charity[] }) {
  const router = useRouter()
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const { data: session, isPending: sessionPending } = authClient.useSession()

  async function handleCheckout() {
    if (!session?.user) {
      router.push("/auth")
      return
    }

    try {
      setIsPending(true)
      setMessage(null)
      const response = await fetch("/api/polar/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
        }),
      })

      const result = (await response.json()) as {
        checkoutUrl?: string
        message?: string
      }

      if (!response.ok || !result.checkoutUrl) {
        setMessage(result.message ?? "Unable to start Polar checkout.")
        return
      }

      window.location.href = result.checkoutUrl
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="shadow-[0_18px_80px_rgba(15,23,42,0.08)]">
      <CardHeader>
        <CardDescription className="text-xs uppercase tracking-[0.3em]">
          Initiate subscription
        </CardDescription>
        <CardTitle className="text-3xl">Authenticated Polar checkout</CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-7">
          The live subscription path now uses Better Auth plus the Polar plugin.
          Visitors create an account first, then checkout runs with the authenticated
          customer attached automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPlan("monthly")}
              className={`rounded-xl border px-4 py-4 text-left transition ${plan === "monthly" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-border bg-muted/50"}`}
            >
              <p className="text-muted-foreground text-sm">Monthly</p>
              <p className="mt-1 text-2xl font-semibold">$29</p>
            </button>
            <button
              type="button"
              onClick={() => setPlan("yearly")}
              className={`rounded-xl border px-4 py-4 text-left transition ${plan === "yearly" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-border bg-muted/50"}`}
            >
              <p className="text-muted-foreground text-sm">Yearly</p>
              <p className="mt-1 text-2xl font-semibold">$299</p>
            </button>
          </div>
          <Card className="bg-muted/40 shadow-none">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-sm">Included charities</p>
              <div className="mt-3 space-y-2">
                {charities.slice(0, 3).map((charity) => (
                  <div key={charity.id} className="text-sm text-foreground">
                    {charity.name}
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                {sessionPending
                  ? "Checking account session..."
                  : session?.user
                    ? `Signed in as ${session.user.email}`
                    : "No active account session yet."}
              </p>
              {message ? (
                <div className="text-muted-foreground mt-3 rounded-md border bg-background px-3 py-2 text-sm">
                  {message}
                </div>
              ) : null}
              <div className="mt-4 flex flex-col gap-3">
                <Button
                  disabled={isPending}
                  onClick={handleCheckout}
                  className="h-11 rounded-md"
                >
                  {isPending
                    ? "Opening checkout..."
                    : session?.user
                      ? "Continue to Polar checkout"
                      : "Create account first"}
                </Button>
                {!session?.user ? (
                  <Link
                    href="/auth"
                    className="text-sm font-medium text-foreground underline underline-offset-4"
                  >
                    Open Better Auth sign up
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
