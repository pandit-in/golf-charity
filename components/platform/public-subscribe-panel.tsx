"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
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
      const result = await authClient.checkout({
        slug: plan === "monthly" ? "golf-charity" : "golf-charity-yearly",
      })

      if (result.error) {
        setMessage(result.error.message ?? "Unable to start Polar checkout.")
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_18px_80px_rgba(15,23,42,0.08)]">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Initiate subscription</p>
      <h2 className="mt-3 text-3xl font-semibold">Authenticated Polar checkout</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        The live subscription path now uses Better Auth plus the Polar plugin. Visitors create an account first, then checkout runs with the authenticated customer attached automatically.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            className={`rounded-[24px] border px-4 py-4 text-left transition ${plan === "monthly" ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
          >
            <p className="text-sm text-slate-500">Monthly</p>
            <p className="mt-1 text-2xl font-semibold">$29</p>
          </button>
          <button
            type="button"
            onClick={() => setPlan("yearly")}
            className={`rounded-[24px] border px-4 py-4 text-left transition ${plan === "yearly" ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
          >
            <p className="text-sm text-slate-500">Yearly</p>
            <p className="mt-1 text-2xl font-semibold">$299</p>
          </button>
        </div>
        <div className="rounded-[28px] bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Included charities</p>
          <div className="mt-3 space-y-2">
            {charities.slice(0, 3).map((charity) => (
              <div key={charity.id} className="text-sm text-slate-700">
                {charity.name}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {sessionPending
              ? "Checking account session..."
              : session?.user
                ? `Signed in as ${session.user.email}`
                : "No active account session yet."}
          </p>
          {message ? <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">{message}</div> : null}
          <div className="mt-4 flex flex-col gap-3">
            <Button disabled={isPending} onClick={handleCheckout} className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800">
              {isPending ? "Opening checkout..." : session?.user ? "Continue to Polar checkout" : "Create account first"}
            </Button>
            {!session?.user ? (
              <Link href="/auth" className="text-sm font-medium text-slate-700 underline underline-offset-4">
                Open Better Auth sign up
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
