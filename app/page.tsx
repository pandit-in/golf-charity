import Link from "next/link"

import { PublicSubscribePanel } from "@/components/platform/public-subscribe-panel"
import { getPublicSnapshot } from "@/lib/platform/service"
import {
  cnNumberList,
  formatCurrency,
  formatMonthLabel,
} from "@/lib/platform/utils"

export default async function Page() {
  const data = await getPublicSnapshot()

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6efe3] text-slate-950">
      <section className="relative isolate px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top_left,_rgba(255,138,101,0.55),_transparent_30%),radial-gradient(circle_at_65%_20%,_rgba(87,214,168,0.45),_transparent_28%),linear-gradient(180deg,#0d1716,#102723_40%,#f6efe3_100%)]" />
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-4 rounded-[30px] border border-white/10 bg-white/8 px-5 py-4 text-white backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/55">Golf Charity Subscription Platform</p>
              <p className="mt-1 text-lg font-semibold">Digital Heroes PRD MVP</p>
            </div>
            <nav className="flex gap-3 text-sm text-white/75">
              <Link href="/dashboard" className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/5">Subscriber Dashboard</Link>
              <Link href="/admin" className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/5">Admin Dashboard</Link>
            </nav>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[38px] border border-white/10 bg-[#0b1614]/88 p-8 text-white shadow-[0_24px_120px_rgba(6,13,12,0.45)]">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/55">Purpose-led play</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
                A golf subscription that turns every score into impact.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
                Members log their latest Stableford rounds, stay entered in a monthly reward draw, and direct a visible share of their subscription to the charity they care about most.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard" className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-300 px-6 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200">Explore subscriber journey</Link>
                <Link href="/admin" className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white transition hover:bg-white/6">Open admin controls</Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 text-white backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-white/55">Upcoming draw</p>
                <p className="mt-3 text-3xl font-semibold">{cnNumberList(data.nextDraw.simulatedNumbers)}</p>
                <p className="mt-2 text-sm text-white/65">{formatMonthLabel(data.nextDraw.month)} · {data.nextDraw.logic} logic</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[32px] bg-[#fff8f0] p-6 shadow-[0_16px_60px_rgba(14,23,20,0.08)]">
                  <p className="text-sm text-slate-500">Monthly from</p>
                  <p className="mt-2 text-4xl font-semibold">{formatCurrency(data.plans.monthlyPriceCents)}</p>
                  <p className="mt-2 text-sm text-slate-600">{data.plans.minimumCharityPercent}% minimum charity allocation</p>
                </div>
                <div className="rounded-[32px] bg-[#ecfff6] p-6 shadow-[0_16px_60px_rgba(14,23,20,0.08)]">
                  <p className="text-sm text-slate-500">Current jackpot</p>
                  <p className="mt-2 text-4xl font-semibold">{formatCurrency(data.stats.monthlyJackpotCents)}</p>
                  <p className="mt-2 text-sm text-slate-600">{data.stats.activeSubscribers} active members driving the pool</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[34px] bg-white p-7 shadow-[0_18px_80px_rgba(15,23,42,0.08)]">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Featured charity</p>
            <h2 className="mt-3 text-3xl font-semibold">{data.featuredCharity.name}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{data.featuredCharity.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {data.featuredCharity.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{tag}</span>
              ))}
            </div>
            <p className="mt-6 text-sm font-medium text-emerald-700">{data.featuredCharity.upcomingEvent}</p>
          </div>

          <div className="rounded-[34px] border border-slate-200 bg-[#fffdf8] p-7">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] bg-[#fff4e8] p-5">
                <p className="text-sm text-slate-500">Active subscribers</p>
                <p className="mt-2 text-3xl font-semibold">{data.stats.activeSubscribers}</p>
              </div>
              <div className="rounded-[28px] bg-[#eefbf5] p-5">
                <p className="text-sm text-slate-500">Prize pool</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(data.stats.totalPrizePoolCents)}</p>
              </div>
              <div className="rounded-[28px] bg-[#f3f5ff] p-5">
                <p className="text-sm text-slate-500">Charity impact</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(data.stats.totalRaisedCents)}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {data.recentWinners.map((winner) => (
                <div key={`${winner.drawMonth}-${winner.userName}`} className="rounded-[26px] border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{formatMonthLabel(winner.drawMonth)}</p>
                  <p className="mt-2 text-xl font-semibold">{winner.userName}</p>
                  <p className="mt-2 text-sm text-slate-600">{winner.matchCount} matches · {formatCurrency(winner.amountCents)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PublicSubscribePanel charities={data.charities} />
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[36px] bg-[#0f1f1c] p-8 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-white/45">Charity directory</p>
              <h2 className="mt-3 text-4xl font-semibold">Browse causes, track scores, and manage draws without golf-site clichés.</h2>
            </div>
            <p className="max-w-xl text-white/65">The build follows the PRD emphasis on emotion-first design, score retention logic, draw simulation, charity selection, and admin reporting.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {data.charities.map((charity) => (
              <article key={charity.id} className="rounded-[30px] border border-white/10 bg-white/6 p-5">
                <p className="text-sm text-white/50">{charity.location}</p>
                <h3 className="mt-2 text-2xl font-semibold">{charity.name}</h3>
                <p className="mt-3 text-sm leading-7 text-white/70">{charity.description}</p>
                <p className="mt-4 text-sm text-emerald-200">{charity.upcomingEvent}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
