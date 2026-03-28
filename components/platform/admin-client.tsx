"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BarChart3,
  CircleDollarSign,
  LoaderCircle,
  Sparkles,
  Users,
} from "lucide-react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  adminUpdateUserAction,
  createCharityAction,
  markWinnerPaidAction,
  publishDrawAction,
  reviewWinnerAction,
  simulateDrawAction,
} from "@/lib/platform/actions"
import type { AdminSnapshot, DrawLogic } from "@/lib/platform/types"
import {
  cnNumberList,
  formatCurrency,
  formatMonthLabel,
} from "@/lib/platform/utils"

async function getAdminData() {
  const response = await fetch("/api/platform/admin")
  if (!response.ok) {
    throw new Error("Unable to load admin dashboard")
  }
  return (await response.json()) as AdminSnapshot
}

function AdminCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function AdminClient() {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [logicByDraw, setLogicByDraw] = useState<Record<string, DrawLogic>>({})
  const [userDrafts, setUserDrafts] = useState<
    Record<
      string,
      {
        name: string
        city: string
        plan: "monthly" | "yearly"
        subscriptionStatus: "active" | "inactive" | "lapsed"
        charityPercent: string
      }
    >
  >({})
  const [charityForm, setCharityForm] = useState({
    name: "",
    description: "",
    location: "",
    upcomingEvent: "",
    tags: "",
    image: "",
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-admin"],
    queryFn: getAdminData,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        Admin dashboard failed to load.
      </div>
    )
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["platform-admin"] })
    await queryClient.invalidateQueries({ queryKey: ["platform-dashboard", "user-avery"] })
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

  return (
    <div className="space-y-8">
      <div className="rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,#fffaf0,#f8fafc_35%,#eefbf5)] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Admin Control Room</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              Operate subscription growth, draws, and payout review from one place.
            </h1>
            <p className="mt-3 text-slate-600">
              This admin layer now includes editable subscriber and subscription controls, draw operations, charity management, and payout review.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="size-4" /> Users
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {data.analytics.totalUsers}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Sparkles className="size-4" /> Active
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {data.analytics.activeSubscribers}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CircleDollarSign className="size-4" /> Prize pool
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {formatCurrency(data.analytics.totalPrizePoolCents)}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <BarChart3 className="size-4" /> Charity
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {formatCurrency(data.analytics.totalCharityCents)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard title="Draw management">
          <div className="space-y-4">
            {data.draws.map((draw) => {
              const logic = logicByDraw[draw.id] ?? draw.logic
              return (
                <div
                  key={draw.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                        {formatMonthLabel(draw.month)}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {draw.status === "published"
                          ? cnNumberList(draw.numbers)
                          : cnNumberList(draw.simulatedNumbers)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Jackpot rollover {formatCurrency(draw.jackpotRolloverCents)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={logic}
                        onChange={(event) =>
                          setLogicByDraw((current) => ({
                            ...current,
                            [draw.id]: event.target.value as DrawLogic,
                          }))
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                      >
                        <option value="weighted">Weighted</option>
                        <option value="random">Random</option>
                      </select>
                      {draw.status === "draft" ? (
                        <>
                          <Button
                            disabled={isPending}
                            variant="outline"
                            onClick={() =>
                              runAction(() =>
                                simulateDrawAction({
                                  drawId: draw.id,
                                  logic,
                                }),
                              )
                            }
                          >
                            Simulate
                          </Button>
                          <Button
                            disabled={isPending}
                            onClick={() => runAction(() => publishDrawAction(draw.id))}
                            className="bg-slate-950 text-white hover:bg-slate-800"
                          >
                            Publish
                          </Button>
                        </>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                          Published
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </AdminCard>

        <AdminCard title="Charity management">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={charityForm.name}
                onChange={(event) =>
                  setCharityForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Charity name"
                className="rounded-2xl border border-slate-200 px-3 py-2.5 outline-none"
              />
              <input
                value={charityForm.location}
                onChange={(event) =>
                  setCharityForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                placeholder="Location"
                className="rounded-2xl border border-slate-200 px-3 py-2.5 outline-none"
              />
            </div>
            <textarea
              value={charityForm.description}
              onChange={(event) =>
                setCharityForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Description"
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={charityForm.upcomingEvent}
                onChange={(event) =>
                  setCharityForm((current) => ({
                    ...current,
                    upcomingEvent: event.target.value,
                  }))
                }
                placeholder="Upcoming event"
                className="rounded-2xl border border-slate-200 px-3 py-2.5 outline-none"
              />
              <input
                value={charityForm.tags}
                onChange={(event) =>
                  setCharityForm((current) => ({ ...current, tags: event.target.value }))
                }
                placeholder="Tags, comma separated"
                className="rounded-2xl border border-slate-200 px-3 py-2.5 outline-none"
              />
            </div>
            <input
              value={charityForm.image}
              onChange={(event) =>
                setCharityForm((current) => ({ ...current, image: event.target.value }))
              }
              placeholder="Image URL"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none"
            />
            <Button
              disabled={isPending}
              onClick={() =>
                runAction(async () => {
                  const result = await createCharityAction(charityForm)
                  if (result.ok) {
                    setCharityForm({
                      name: "",
                      description: "",
                      location: "",
                      upcomingEvent: "",
                      tags: "",
                      image: "",
                    })
                  }
                  return result
                })
              }
              className="h-11 w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            >
              Add charity
            </Button>
            <div className="space-y-3">
              {data.charities.map((charity) => (
                <div
                  key={charity.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-lg font-semibold text-slate-950">{charity.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{charity.location}</p>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <AdminCard title="Subscriber management">
          <div className="space-y-3">
            {data.users.map((user) => {
              const draft = userDrafts[user.id] ?? {
                name: user.name,
                city: user.city,
                plan: user.plan,
                subscriptionStatus: user.subscriptionStatus,
                charityPercent: String(user.charityPercent),
              }

              return (
                <div
                  key={user.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{user.email}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {user.charityName} · latest score {user.latestScore ?? "—"} ·{" "}
                        {user.polarLinked ? "Polar linked" : "No Polar link"}
                      </p>
                    </div>
                    <Button
                      disabled={isPending}
                      onClick={() =>
                        runAction(() =>
                          adminUpdateUserAction({
                            userId: user.id,
                            name: draft.name,
                            city: draft.city,
                            plan: draft.plan,
                            subscriptionStatus: draft.subscriptionStatus,
                            charityPercent: Number(draft.charityPercent),
                          }),
                        )
                      }
                    >
                      Save subscriber
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        setUserDrafts((current) => ({
                          ...current,
                          [user.id]: { ...draft, name: event.target.value },
                        }))
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 outline-none"
                    />
                    <input
                      value={draft.city}
                      onChange={(event) =>
                        setUserDrafts((current) => ({
                          ...current,
                          [user.id]: { ...draft, city: event.target.value },
                        }))
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 outline-none"
                    />
                    <select
                      value={draft.plan}
                      onChange={(event) =>
                        setUserDrafts((current) => ({
                          ...current,
                          [user.id]: {
                            ...draft,
                            plan: event.target.value as "monthly" | "yearly",
                          },
                        }))
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <select
                      value={draft.subscriptionStatus}
                      onChange={(event) =>
                        setUserDrafts((current) => ({
                          ...current,
                          [user.id]: {
                            ...draft,
                            subscriptionStatus: event.target.value as
                              | "active"
                              | "inactive"
                              | "lapsed",
                          },
                        }))
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="lapsed">Lapsed</option>
                    </select>
                    <input
                      value={draft.charityPercent}
                      onChange={(event) =>
                        setUserDrafts((current) => ({
                          ...current,
                          [user.id]: {
                            ...draft,
                            charityPercent: event.target.value,
                          },
                        }))
                      }
                      type="number"
                      min={10}
                      max={100}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 outline-none"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </AdminCard>

        <AdminCard title="Winner verification and payouts">
          <div className="space-y-3">
            {data.winnerReviews.map((winner) => (
              <div
                key={`${winner.drawId}-${winner.userId}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      {formatMonthLabel(winner.drawMonth)}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {winner.userName} · {winner.matchCount} matches
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatCurrency(winner.amountCents)} · proof {winner.proofStatus} ·
                      payout {winner.paymentStatus}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={isPending}
                      variant="outline"
                      onClick={() =>
                        runAction(() =>
                          reviewWinnerAction({
                            drawId: winner.drawId,
                            userId: winner.userId,
                            decision: "approved",
                          }),
                        )
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      disabled={isPending}
                      variant="outline"
                      onClick={() =>
                        runAction(() =>
                          reviewWinnerAction({
                            drawId: winner.drawId,
                            userId: winner.userId,
                            decision: "rejected",
                          }),
                        )
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      disabled={isPending || winner.paymentStatus === "paid"}
                      onClick={() =>
                        runAction(() =>
                          markWinnerPaidAction({
                            drawId: winner.drawId,
                            userId: winner.userId,
                          }),
                        )
                      }
                      className="bg-slate-950 text-white hover:bg-slate-800"
                    >
                      Mark paid
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
