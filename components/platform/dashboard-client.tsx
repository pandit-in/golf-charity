"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  HeartHandshake,
  LoaderCircle,
  Target,
  Trophy,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import {
  addScoreAction,
  submitWinnerProofAction,
  updateProfileAction,
  updateCharitySelectionAction,
} from "@/lib/platform/actions"
import type { DashboardSnapshot } from "@/lib/platform/types"
import {
  cnNumberList,
  formatCurrency,
  formatDate,
  formatMonthLabel,
} from "@/lib/platform/utils"

async function getDashboardData() {
  const response = await fetch("/api/platform/dashboard?userId=user-avery")
  if (!response.ok) {
    throw new Error("Unable to load dashboard")
  }
  return (await response.json()) as DashboardSnapshot
}

function Card({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur">
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.3em] text-white/45">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function DashboardClient() {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [proofUrl, setProofUrl] = useState("")
  const [scoreDate, setScoreDate] = useState(new Date().toISOString().slice(0, 10))
  const [scoreValue, setScoreValue] = useState("32")
  const [charityId, setCharityId] = useState("")
  const [charityPercent, setCharityPercent] = useState("18")
  const [profileName, setProfileName] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [profileCity, setProfileCity] = useState("")
  const [profileBio, setProfileBio] = useState("")
  const [drawAlerts, setDrawAlerts] = useState(true)
  const [winnerAlerts, setWinnerAlerts] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-dashboard", "user-avery"],
    queryFn: getDashboardData,
  })
  const { data: session, isPending: sessionPending } = authClient.useSession()

  const pendingProof = useMemo(
    () =>
      data?.recentDraws.find(
        (draw) =>
          draw.result &&
          draw.result.paymentStatus === "pending" &&
          draw.result.proofStatus !== "approved",
      ) ?? null,
    [data],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
        Dashboard failed to load.
      </div>
    )
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["platform-dashboard", "user-avery"] })
    await queryClient.invalidateQueries({ queryKey: ["platform-admin"] })
  }

  function runAction(callback: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const result = await callback()
      setMessage(result.message)
      if (result.ok) {
        await refresh()
      }
    })
  }

  async function handlePolarCheckout(planSlug: "golf-charity" | "golf-charity-yearly") {
    if (!session?.user) {
      setMessage("Sign in first to use the Better Auth + Polar checkout flow.")
      return
    }

    const result = await authClient.checkout({
      slug: planSlug,
    })

    if (result.error) {
      const rawMessage = result.error.message ?? "Unable to open checkout."
      if (rawMessage.includes("Customer external ID cannot be updated")) {
        setMessage(
          "Polar already has this email linked to an older customer record. Use a new sandbox email or delete the old Polar customer before retrying checkout.",
        )
        return
      }
      setMessage(rawMessage)
    }
  }

  async function handlePortal() {
    if (!session?.user) {
      setMessage("Sign in first to open the customer portal.")
      return
    }

    const result = await authClient.customer.portal()
    if (result.error) {
      setMessage(result.error.message ?? "Unable to open customer portal.")
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[36px] border border-emerald-200/15 bg-[radial-gradient(circle_at_top_left,_rgba(89,212,167,0.35),_transparent_35%),linear-gradient(135deg,rgba(8,19,17,0.95),rgba(9,34,29,0.82))] p-8 text-white shadow-[0_24px_100px_rgba(4,18,16,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-100/55">
              Subscriber Dashboard
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Play your next round with purpose.
            </h1>
            <p className="max-w-xl text-base text-white/72">
              Every score keeps you entered, every renewal grows the pool, and your charity contribution stays visible all month.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
              <div className="flex items-center gap-2 text-white/60">
                <Wallet className="size-4" /> Status
              </div>
              <p className="mt-3 text-2xl font-semibold capitalize">{data.subscription.status}</p>
              <p className="text-sm text-white/55">Renews {formatDate(data.subscription.renewsAt)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
              <div className="flex items-center gap-2 text-white/60">
                <Trophy className="size-4" /> Pending pool
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {formatCurrency(data.winnings.pendingCents)}
              </p>
              <p className="text-sm text-white/55">
                {formatMonthLabel(data.participation.upcomingDrawMonth)} entry live
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
              <div className="flex items-center gap-2 text-white/60">
                <HeartHandshake className="size-4" /> Charity
              </div>
              <p className="mt-3 text-xl font-semibold">{data.selectedCharity.name}</p>
              <p className="text-sm text-white/55">
                {data.subscription.charityPercent}% of your plan
              </p>
            </div>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Last 5 Stableford scores" eyebrow="Score Engine">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form
              className="space-y-4 rounded-3xl border border-white/8 bg-black/15 p-4"
              onSubmit={(event) => {
                event.preventDefault()
                runAction(() =>
                  addScoreAction({
                    userId: data.viewer.id,
                    date: scoreDate,
                    value: Number(scoreValue),
                  }),
                )
              }}
            >
              <div>
                <label className="mb-2 block text-sm text-white/70">Round date</label>
                <input
                  value={scoreDate}
                  onChange={(event) => setScoreDate(event.target.value)}
                  type="date"
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-2.5 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/70">Stableford score</label>
                <input
                  value={scoreValue}
                  onChange={(event) => setScoreValue(event.target.value)}
                  type="number"
                  min={1}
                  max={45}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-2.5 text-white outline-none"
                />
              </div>
              <Button
                disabled={isPending}
                type="submit"
                className="h-11 w-full rounded-2xl bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
              >
                {isPending ? "Saving..." : "Save score"}
              </Button>
            </form>
            <div className="space-y-3">
              {data.scores.map((score, index) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between rounded-3xl border border-white/8 bg-white/[0.04] px-4 py-4"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                      Round {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {formatDate(score.date)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/8 px-4 py-2 text-2xl font-semibold text-emerald-200">
                    {score.value}
                  </div>
                </div>
              ))}
              <p className="text-sm text-white/45">
                The system automatically keeps only your most recent five rounds.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Charity allocation" eyebrow="Giving Control">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/8 bg-black/15 p-4">
                <p className="text-sm text-white/55">{data.selectedCharity.location}</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {data.selectedCharity.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {data.selectedCharity.description}
                </p>
                <p className="mt-4 text-sm text-emerald-200">
                  {data.selectedCharity.upcomingEvent}
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/70">Choose your charity</label>
                <select
                  value={charityId || data.selectedCharity.id}
                  onChange={(event) => setCharityId(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-white outline-none"
                >
                  {data.charities.map((charity) => (
                    <option key={charity.id} value={charity.id} className="bg-slate-900">
                      {charity.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Contribution percentage
                </label>
                <input
                  value={charityPercent || String(data.subscription.charityPercent)}
                  onChange={(event) => setCharityPercent(event.target.value)}
                  type="number"
                  min={10}
                  max={100}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-white outline-none"
                />
              </div>
              <Button
                disabled={isPending}
                onClick={() =>
                  runAction(() =>
                    updateCharitySelectionAction({
                      userId: data.viewer.id,
                      charityId: charityId || data.selectedCharity.id,
                      charityPercent: Number(
                        charityPercent || String(data.subscription.charityPercent),
                      ),
                    }),
                  )
                }
                className="h-11 w-full rounded-2xl bg-white text-slate-950 hover:bg-white/90"
              >
                Update charity plan
              </Button>
            </div>
          </Card>

          <Card title="Participation and winnings" eyebrow="Monthly Draws">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/6 p-4">
                <p className="text-sm text-white/55">Draws entered</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {data.participation.drawsEntered}
                </p>
              </div>
              <div className="rounded-3xl bg-white/6 p-4">
                <p className="text-sm text-white/55">Total won</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {formatCurrency(data.winnings.totalWonCents)}
                </p>
              </div>
              <div className="rounded-3xl bg-white/6 p-4">
                <p className="text-sm text-white/55">Paid out</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {formatCurrency(data.winnings.paidCents)}
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-3xl border border-dashed border-emerald-300/30 bg-emerald-300/10 p-4">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-emerald-100/70">
                <Target className="size-4" />
                Upcoming numbers
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">
                {cnNumberList(data.participation.upcomingDrawNumbers)}
              </p>
              <p className="mt-1 text-sm text-white/55">
                {formatMonthLabel(data.participation.upcomingDrawMonth)}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="Profile and settings" eyebrow="Registered Subscriber">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={profileName || data.viewer.name}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder="Full name"
                className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-white outline-none"
              />
              <input
                value={profileEmail || data.viewer.email}
                onChange={(event) => setProfileEmail(event.target.value)}
                placeholder="Email"
                className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-white outline-none"
              />
              <input
                value={profileCity || data.viewer.city}
                onChange={(event) => setProfileCity(event.target.value)}
                placeholder="City"
                className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-white outline-none sm:col-span-2"
              />
            </div>
            <textarea
              value={profileBio || data.viewer.bio || ""}
              onChange={(event) => setProfileBio(event.target.value)}
              rows={4}
              placeholder="Bio"
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-white outline-none"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={drawAlerts}
                  onChange={(event) => setDrawAlerts(event.target.checked)}
                />
                Draw alerts
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={winnerAlerts}
                  onChange={(event) => setWinnerAlerts(event.target.checked)}
                />
                Winner alerts
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={marketingEmails}
                  onChange={(event) => setMarketingEmails(event.target.checked)}
                />
                Marketing
              </label>
            </div>
            <Button
              disabled={isPending}
              onClick={() =>
                runAction(() =>
                  updateProfileAction({
                    userId: data.viewer.id,
                    name: profileName || data.viewer.name,
                    email: profileEmail || data.viewer.email,
                    city: profileCity || data.viewer.city,
                    bio: profileBio || data.viewer.bio || "Subscriber profile",
                    drawAlerts,
                    winnerAlerts,
                    marketingEmails,
                  }),
                )
              }
              className="h-11 w-full rounded-2xl bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
            >
              Save profile settings
            </Button>
          </div>
        </Card>

        <Card title="Subscription and billing" eyebrow="Better Auth + Polar">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4">
              <p className="text-sm text-white/55">Authenticated billing status</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {sessionPending
                  ? "Checking session..."
                  : session?.user
                    ? `Signed in as ${session.user.email}`
                    : "No authenticated account"}
              </p>
              <p className="mt-2 text-sm text-white/60">
                The live checkout flow uses Better Auth with the Polar plugin and requires an authenticated user.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                disabled={isPending}
                onClick={() => handlePolarCheckout("golf-charity")}
                className="h-11 rounded-2xl bg-white text-slate-950 hover:bg-white/90"
              >
                Start monthly checkout
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handlePolarCheckout("golf-charity-yearly")}
                variant="outline"
                className="h-11 rounded-2xl border-white/15 bg-transparent text-white hover:bg-white/8"
              >
                Start yearly checkout
              </Button>
            </div>
            <Button
              disabled={isPending || !session?.user}
              onClick={handlePortal}
              className="h-11 w-full rounded-2xl bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
            >
              Open customer portal
            </Button>
            {!session?.user ? (
              <Link
                href="/auth"
                className="inline-flex text-sm font-medium text-emerald-200 underline underline-offset-4"
              >
                Sign in or create account
              </Link>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Draw history" eyebrow="Performance">
          <div className="space-y-3">
            {data.recentDraws.map((draw) => (
              <div
                key={draw.id}
                className="rounded-3xl border border-white/8 bg-white/[0.04] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                      {formatMonthLabel(draw.month)}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {draw.status === "published"
                        ? cnNumberList(draw.numbers)
                        : cnNumberList(draw.simulatedNumbers)}
                    </p>
                  </div>
                  <div className="text-sm text-white/65">
                    {draw.result
                      ? `${draw.result.matchCount} matches · ${formatCurrency(draw.result.amountCents)}`
                      : "No win recorded"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Winner verification" eyebrow="Proof Upload">
          {pendingProof ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                  {formatMonthLabel(pendingProof.month)}
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {pendingProof.result?.matchCount} matches for{" "}
                  {formatCurrency(pendingProof.result?.amountCents ?? 0)}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Current review state:{" "}
                  <span className="capitalize">{pendingProof.result?.proofStatus}</span>
                </p>
              </div>
              <input
                value={proofUrl}
                onChange={(event) => setProofUrl(event.target.value)}
                placeholder="https://proof-link.example"
                className="w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-white outline-none"
              />
              <Button
                disabled={isPending || !proofUrl}
                onClick={() =>
                  runAction(() =>
                    submitWinnerProofAction({
                      drawId: pendingProof.id,
                      userId: data.viewer.id,
                      proofUrl,
                    }),
                  )
                }
                className="h-11 w-full rounded-2xl bg-amber-300 text-slate-950 hover:bg-amber-200"
              >
                Submit proof
              </Button>
            </div>
          ) : (
            <p className="text-sm leading-6 text-white/65">
              No winner proof is needed right now. If you land in a payout tier, this panel will open automatically.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
