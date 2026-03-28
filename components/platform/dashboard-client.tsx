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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const surfaceClassName = "border-white/10 bg-card/60 text-card-foreground"
const insetClassName = "rounded-xl border border-white/10 bg-background/50"

async function getDashboardData() {
  const response = await fetch("/api/platform/dashboard?userId=user-avery")
  if (!response.ok) {
    throw new Error("Unable to load dashboard")
  }
  return (await response.json()) as DashboardSnapshot
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
      <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
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
      <Card className="bg-card/60 border-white/10 text-card-foreground shadow-[0_24px_100px_rgba(4,18,16,0.45)] backdrop-blur">
        <CardContent className="grid gap-6 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-2xl space-y-3">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.35em]">
              Subscriber Dashboard
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Play your next round with purpose.
            </h1>
            <p className="text-muted-foreground max-w-xl text-base">
              Every score keeps you entered, every renewal grows the pool, and your charity contribution stays visible all month.
            </p>
          </div>
            <div className="grid gap-3 sm:grid-cols-3">
            <div className={`${insetClassName} p-4`}>
              <div className="text-muted-foreground flex items-center gap-2">
                <Wallet className="size-4" /> Status
              </div>
              <p className="mt-3 text-2xl font-semibold capitalize">{data.subscription.status}</p>
              <p className="text-muted-foreground text-sm">
                Renews {formatDate(data.subscription.renewsAt)}
              </p>
            </div>
            <div className={`${insetClassName} p-4`}>
              <div className="text-muted-foreground flex items-center gap-2">
                <Trophy className="size-4" /> Pending pool
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {formatCurrency(data.winnings.pendingCents)}
              </p>
              <p className="text-muted-foreground text-sm">
                {formatMonthLabel(data.participation.upcomingDrawMonth)} entry live
              </p>
            </div>
            <div className={`${insetClassName} p-4`}>
              <div className="text-muted-foreground flex items-center gap-2">
                <HeartHandshake className="size-4" /> Charity
              </div>
              <p className="mt-3 text-xl font-semibold">{data.selectedCharity.name}</p>
              <p className="text-muted-foreground text-sm">
                {data.subscription.charityPercent}% of your plan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {message ? (
        <Card className={surfaceClassName}>
          <CardContent className="p-4 text-sm">{message}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className={surfaceClassName}>
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.3em]">
              Score Engine
            </CardDescription>
            <CardTitle>Last 5 Stableford scores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form
              className={`${insetClassName} space-y-4 p-4`}
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Round date</label>
                <Input
                  value={scoreDate}
                  onChange={(event) => setScoreDate(event.target.value)}
                  type="date"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stableford score</label>
                <Input
                  value={scoreValue}
                  onChange={(event) => setScoreValue(event.target.value)}
                  type="number"
                  min={1}
                  max={45}
                  className="bg-background"
                />
              </div>
              <Button disabled={isPending} type="submit" className="h-11 w-full">
                {isPending ? "Saving..." : "Save score"}
              </Button>
            </form>
            <div className="space-y-3">
              {data.scores.map((score, index) => (
                <div
                  key={score.id}
                  className={`${insetClassName} flex items-center justify-between px-4 py-4`}
                >
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">
                      Round {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-lg font-semibold">{formatDate(score.date)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-background px-4 py-2 text-2xl font-semibold">
                    {score.value}
                  </div>
                </div>
              ))}
              <p className="text-muted-foreground text-sm">
                The system automatically keeps only your most recent five rounds.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className={surfaceClassName}>
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-[0.3em]">
                Giving Control
              </CardDescription>
              <CardTitle>Charity allocation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`${insetClassName} p-4`}>
                <p className="text-muted-foreground text-sm">{data.selectedCharity.location}</p>
                <p className="mt-2 text-xl font-semibold">{data.selectedCharity.name}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {data.selectedCharity.description}
                </p>
                <p className="mt-4 text-sm">{data.selectedCharity.upcomingEvent}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Choose your charity</label>
                <select
                  value={charityId || data.selectedCharity.id}
                  onChange={(event) => setCharityId(event.target.value)}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {data.charities.map((charity) => (
                    <option key={charity.id} value={charity.id} className="bg-slate-900">
                      {charity.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contribution percentage</label>
                <Input
                  value={charityPercent || String(data.subscription.charityPercent)}
                  onChange={(event) => setCharityPercent(event.target.value)}
                  type="number"
                  min={10}
                  max={100}
                  className="bg-background"
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
                className="h-11 w-full"
              >
                Update charity plan
              </Button>
            </CardContent>
          </Card>

          <Card className={surfaceClassName}>
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-[0.3em]">
                Monthly Draws
              </CardDescription>
              <CardTitle>Participation and winnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className={`${insetClassName} p-4`}>
                  <p className="text-muted-foreground text-sm">Draws entered</p>
                  <p className="mt-2 text-3xl font-semibold">{data.participation.drawsEntered}</p>
                </div>
                <div className={`${insetClassName} p-4`}>
                  <p className="text-muted-foreground text-sm">Total won</p>
                  <p className="mt-2 text-3xl font-semibold">
                    {formatCurrency(data.winnings.totalWonCents)}
                  </p>
                </div>
                <div className={`${insetClassName} p-4`}>
                  <p className="text-muted-foreground text-sm">Paid out</p>
                  <p className="mt-2 text-3xl font-semibold">
                    {formatCurrency(data.winnings.paidCents)}
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-dashed border-emerald-300/30 bg-emerald-300/10 p-4">
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em]">
                  <Target className="size-4" />
                  Upcoming numbers
                </div>
                <p className="mt-3 text-2xl font-semibold">
                  {cnNumberList(data.participation.upcomingDrawNumbers)}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {formatMonthLabel(data.participation.upcomingDrawMonth)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className={surfaceClassName}>
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.3em]">
              Registered Subscriber
            </CardDescription>
            <CardTitle>Profile and settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full name</label>
                <Input
                  value={profileName || data.viewer.name}
                  onChange={(event) => setProfileName(event.target.value)}
                  placeholder="Full name"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={profileEmail || data.viewer.email}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  placeholder="Email"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">City</label>
                <Input
                  value={profileCity || data.viewer.city}
                  onChange={(event) => setProfileCity(event.target.value)}
                  placeholder="City"
                  className="bg-background"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                value={profileBio || data.viewer.bio || ""}
                onChange={(event) => setProfileBio(event.target.value)}
                rows={4}
                placeholder="Bio"
                className="bg-background"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className={`${insetClassName} flex items-center gap-3 px-3 py-3 text-sm`}>
                <input
                  type="checkbox"
                  checked={drawAlerts}
                  onChange={(event) => setDrawAlerts(event.target.checked)}
                />
                Draw alerts
              </label>
              <label className={`${insetClassName} flex items-center gap-3 px-3 py-3 text-sm`}>
                <input
                  type="checkbox"
                  checked={winnerAlerts}
                  onChange={(event) => setWinnerAlerts(event.target.checked)}
                />
                Winner alerts
              </label>
              <label className={`${insetClassName} flex items-center gap-3 px-3 py-3 text-sm`}>
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
              className="h-11 w-full"
            >
              Save profile settings
            </Button>
          </CardContent>
        </Card>

        <Card className={surfaceClassName}>
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.3em]">
              Better Auth + Polar
            </CardDescription>
            <CardTitle>Subscription and billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`${insetClassName} p-4`}>
              <p className="text-muted-foreground text-sm">Authenticated billing status</p>
              <p className="mt-2 text-2xl font-semibold">
                {sessionPending
                  ? "Checking session..."
                  : session?.user
                    ? `Signed in as ${session.user.email}`
                    : "No authenticated account"}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                The live checkout flow uses Better Auth with the Polar plugin and requires an authenticated user.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className={`rounded-xl border p-4 ${
                  data.subscription.plan === "monthly"
                    ? "border-emerald-300/40 bg-emerald-300/10"
                    : insetClassName
                }`}
              >
                <p className="text-muted-foreground text-sm uppercase tracking-[0.25em]">
                  Monthly
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(data.billing.plans.monthlyPriceCents)}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">Flexible monthly renewal.</p>
                <Button
                  disabled={isPending}
                  onClick={() => handlePolarCheckout("golf-charity")}
                  className="mt-4 h-11 w-full"
                >
                  {data.subscription.plan === "monthly"
                    ? "Renew monthly in Polar"
                    : "Switch to monthly"}
                </Button>
              </div>
              <div
                className={`rounded-xl border p-4 ${
                  data.subscription.plan === "yearly"
                    ? "border-emerald-300/40 bg-emerald-300/10"
                    : insetClassName
                }`}
              >
                <p className="text-muted-foreground text-sm uppercase tracking-[0.25em]">
                  Yearly
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(data.billing.plans.yearlyPriceCents)}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Discounted annual commitment.
                </p>
                <Button
                  disabled={isPending}
                  onClick={() => handlePolarCheckout("golf-charity-yearly")}
                  variant="outline"
                  className="mt-4 h-11 w-full border-white/15 bg-transparent hover:bg-white/8"
                >
                  {data.subscription.plan === "yearly"
                    ? "Renew yearly in Polar"
                    : "Switch to yearly"}
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4">
              <p className="text-sm font-medium text-amber-100">Sandbox retry tip</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                If Polar says the customer external ID cannot be updated, that email already belongs to an older Polar customer. Use a fresh test email or delete that sandbox customer before retrying checkout.
              </p>
            </div>
            <Button
              disabled={isPending || !session?.user}
              onClick={handlePortal}
              className="h-11 w-full"
            >
              Open customer portal
            </Button>
            <div className={`${insetClassName} px-4 py-3 text-sm`}>
              Current plan:{" "}
              <span className="font-medium capitalize">{data.subscription.plan}</span>
              {" | "}Status:{" "}
              <span className="font-medium capitalize">{data.subscription.status}</span>
            </div>
            {!session?.user ? (
              <Link
                href="/auth"
                className="inline-flex text-sm font-medium underline underline-offset-4"
              >
                Sign in or create account
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className={surfaceClassName}>
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.3em]">
              Performance
            </CardDescription>
            <CardTitle>Draw history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentDraws.map((draw) => (
              <div
                key={draw.id}
                className={`${insetClassName} p-4`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">
                      {formatMonthLabel(draw.month)}
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {draw.status === "published"
                        ? cnNumberList(draw.numbers)
                        : cnNumberList(draw.simulatedNumbers)}
                    </p>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {draw.result
                      ? `${draw.result.matchCount} matches | ${formatCurrency(draw.result.amountCents)}`
                      : "No win recorded"}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={surfaceClassName}>
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.3em]">
              Proof Upload
            </CardDescription>
            <CardTitle>Winner verification</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingProof ? (
              <div className="space-y-4">
                <div className={`${insetClassName} p-4`}>
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">
                    {formatMonthLabel(pendingProof.month)}
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {pendingProof.result?.matchCount} matches for{" "}
                    {formatCurrency(pendingProof.result?.amountCents ?? 0)}
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Current review state:{" "}
                    <span className="capitalize">{pendingProof.result?.proofStatus}</span>
                  </p>
                </div>
                <Input
                  value={proofUrl}
                  onChange={(event) => setProofUrl(event.target.value)}
                  placeholder="https://proof-link.example"
                  className="bg-background"
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
                  className="h-11 w-full"
                >
                  Submit proof
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm leading-6">
                No winner proof is needed right now. If you land in a payout tier, this panel will open automatically.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
