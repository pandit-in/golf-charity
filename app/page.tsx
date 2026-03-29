import Link from "next/link"

import { PublicSubscribePanel } from "@/components/platform/public-subscribe-panel"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPublicSnapshot } from "@/lib/platform/service"
import {
  cnNumberList,
  formatCurrency,
  formatMonthLabel,
} from "@/lib/platform/utils"

export default async function Page() {
  const data = await getPublicSnapshot()

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6efe3] text-foreground dark:bg-[#071412]">
      <section className="relative isolate px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top_left,_rgba(255,138,101,0.55),_transparent_30%),radial-gradient(circle_at_65%_20%,_rgba(87,214,168,0.45),_transparent_28%),linear-gradient(180deg,#0d1716,#102723_40%,#f6efe3_100%)]" />
        <div className="mx-auto max-w-7xl">
          <Card className="border-white/10 bg-white/8 text-white backdrop-blur">
            <CardContent className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                  Golf Charity Subscription Platform
                </p>
                <p className="mt-1 text-lg font-semibold">Digital Heroes PRD MVP</p>
              </div>
              <nav className="flex gap-3 text-sm text-white/75">
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center rounded-md border border-white/15 px-4 transition hover:bg-white/5"
                >
                  Subscriber Dashboard
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex h-10 items-center rounded-md border border-white/15 px-4 transition hover:bg-white/5"
                >
                  Admin Dashboard
                </Link>
              </nav>
            </CardContent>
          </Card>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-white/10 bg-[#0b1614]/88 text-white shadow-[0_24px_120px_rgba(6,13,12,0.45)]">
              <CardContent className="p-8">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/55">
                  Purpose-led play
                </p>
                <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
                  A golf subscription that turns every score into impact.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
                  Members log their latest Stableford rounds, stay entered in a monthly
                  reward draw, and direct a visible share of their subscription to the
                  charity they care about most.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-300 px-6 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200"
                  >
                    Explore subscriber journey
                  </Link>
                  <Link
                    href="/admin"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white transition hover:bg-white/6"
                  >
                    Open admin controls
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                    Upcoming draw
                  </p>
                  <p className="mt-3 text-3xl font-semibold">
                    {cnNumberList(data.nextDraw.simulatedNumbers)}
                  </p>
                  <p className="mt-2 text-sm text-white/65">
                    {formatMonthLabel(data.nextDraw.month)} · {data.nextDraw.logic} logic
                  </p>
                </CardContent>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-[#fff8f0] text-slate-950 shadow-[0_16px_60px_rgba(14,23,20,0.08)] dark:text-slate-950">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-500 dark:text-slate-500">Monthly from</p>
                    <p className="mt-2 text-4xl font-semibold">
                      {formatCurrency(data.plans.monthlyPriceCents)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-600">
                      {data.plans.minimumCharityPercent}% minimum charity allocation
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[#ecfff6] text-slate-950 shadow-[0_16px_60px_rgba(14,23,20,0.08)] dark:text-slate-950">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-500 dark:text-slate-500">Current jackpot</p>
                    <p className="mt-2 text-4xl font-semibold">
                      {formatCurrency(data.stats.monthlyJackpotCents)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-600">
                      {data.stats.activeSubscribers} active members driving the pool
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="shadow-[0_18px_80px_rgba(15,23,42,0.08)] dark:bg-card/90">
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-[0.3em]">
                Featured charity
              </CardDescription>
              <CardTitle className="text-3xl">{data.featuredCharity.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-sm leading-7">
                {data.featuredCharity.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {data.featuredCharity.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm font-medium text-emerald-700">
                {data.featuredCharity.upcomingEvent}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#fffdf8] dark:bg-card/90">
            <CardContent className="p-7">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-[#fff4e8] text-slate-950 shadow-none dark:text-slate-950">
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-500">Active subscribers</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {data.stats.activeSubscribers}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[#eefbf5] text-slate-950 shadow-none dark:text-slate-950">
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-500">Prize pool</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {formatCurrency(data.stats.totalPrizePoolCents)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[#f3f5ff] text-slate-950 shadow-none dark:text-slate-950">
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-500">Charity impact</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {formatCurrency(data.stats.totalRaisedCents)}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {data.recentWinners.map((winner) => (
                  <Card
                    key={`${winner.drawMonth}-${winner.userName}`}
                    className="bg-white shadow-none dark:bg-muted/60"
                  >
                    <CardContent className="p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">
                        {formatMonthLabel(winner.drawMonth)}
                      </p>
                      <p className="mt-2 text-xl font-semibold">{winner.userName}</p>
                      <p className="text-muted-foreground mt-2 text-sm">
                        {winner.matchCount} matches · {formatCurrency(winner.amountCents)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PublicSubscribePanel charities={data.charities} />
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-7xl bg-[#0f1f1c] text-white">
          <CardContent className="p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                  Charity directory
                </p>
                <h2 className="mt-3 text-4xl font-semibold">
                  Browse causes, track scores, and manage draws without golf-site
                  cliches.
                </h2>
              </div>
              <p className="max-w-xl text-white/65">
                The build follows the PRD emphasis on emotion-first design, score
                retention logic, draw simulation, charity selection, and admin
                reporting.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {data.charities.map((charity) => (
                <Card
                  key={charity.id}
                  className="border-white/10 bg-white/6 text-white shadow-none"
                >
                  <CardContent className="p-5">
                    <p className="text-sm text-white/50">{charity.location}</p>
                    <h3 className="mt-2 text-2xl font-semibold">{charity.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/70">
                      {charity.description}
                    </p>
                    <p className="mt-4 text-sm text-emerald-200">
                      {charity.upcomingEvent}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
