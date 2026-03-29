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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

function inputClassName() {
  return "border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
}

function AdminCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Admin dashboard failed to load.
      </div>
    )
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["platform-admin"] })
    await queryClient.invalidateQueries({ queryKey: ["platform-dashboard"] })
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
      <Card>
        <CardHeader className="gap-4">
          <div className="max-w-2xl space-y-3">
            <CardDescription className="text-xs uppercase tracking-[0.35em]">
              Admin Control Room
            </CardDescription>
            <CardTitle className="text-4xl tracking-tight">
              Operate subscription growth, draws, and payout review from one place.
            </CardTitle>
            <CardDescription className="text-base leading-7">
              This admin layer includes editable subscriber controls, draw operations,
              charity management, and payout review.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="shadow-none">
              <CardContent className="p-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Users className="size-4" /> Users
                </div>
                <p className="mt-2 text-3xl font-semibold">{data.analytics.totalUsers}</p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Sparkles className="size-4" /> Active
                </div>
                <p className="mt-2 text-3xl font-semibold">
                  {data.analytics.activeSubscribers}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CircleDollarSign className="size-4" /> Prize pool
                </div>
                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(data.analytics.totalPrizePoolCents)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <BarChart3 className="size-4" /> Charity
                </div>
                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(data.analytics.totalCharityCents)}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {message ? (
        <Card>
          <CardContent className="px-4 py-3 text-sm text-muted-foreground">
            {message}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard
          title="Draw management"
          description="Simulate and publish monthly draws from the admin console."
        >
          <div className="space-y-4">
            {data.draws.map((draw) => {
              const logic = logicByDraw[draw.id] ?? draw.logic
              return (
                <Card key={draw.id} className="bg-muted/40 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">
                          {formatMonthLabel(draw.month)}
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {draw.status === "published"
                            ? cnNumberList(draw.numbers)
                            : cnNumberList(draw.simulatedNumbers)}
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
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
                          className={inputClassName()}
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
                            >
                              Publish
                            </Button>
                          </>
                        ) : (
                          <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium">
                            Published
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </AdminCard>

        <AdminCard
          title="Charity management"
          description="Add charities and review the current directory."
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={charityForm.name}
                onChange={(event) =>
                  setCharityForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Charity name"
                className={inputClassName()}
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
                className={inputClassName()}
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
              className={inputClassName()}
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
                className={inputClassName()}
              />
              <input
                value={charityForm.tags}
                onChange={(event) =>
                  setCharityForm((current) => ({ ...current, tags: event.target.value }))
                }
                placeholder="Tags, comma separated"
                className={inputClassName()}
              />
            </div>
            <input
              value={charityForm.image}
              onChange={(event) =>
                setCharityForm((current) => ({ ...current, image: event.target.value }))
              }
              placeholder="Image URL"
              className={inputClassName()}
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
              className="h-11 w-full"
            >
              Add charity
            </Button>
            <div className="space-y-3">
              {data.charities.map((charity) => (
                <Card key={charity.id} className="bg-muted/40 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-lg font-semibold">{charity.name}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{charity.location}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <AdminCard
          title="Subscriber management"
          description="Review subscriber details, billing status, and donation settings."
        >
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
                <Card key={user.id} className="bg-muted/40 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold">{user.email}</p>
                        <p className="text-muted-foreground mt-1 text-sm">
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
                        className={inputClassName()}
                      />
                      <input
                        value={draft.city}
                        onChange={(event) =>
                          setUserDrafts((current) => ({
                            ...current,
                            [user.id]: { ...draft, city: event.target.value },
                          }))
                        }
                        className={inputClassName()}
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
                        className={inputClassName()}
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
                        className={inputClassName()}
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
                        className={inputClassName()}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </AdminCard>

        <AdminCard
          title="Winner verification and payouts"
          description="Approve proofs and close payouts for published draws."
        >
          <div className="space-y-3">
            {data.winnerReviews.map((winner) => (
              <Card
                key={`${winner.drawId}-${winner.userId}`}
                className="bg-muted/40 shadow-none"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">
                        {formatMonthLabel(winner.drawMonth)}
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {winner.userName} · {winner.matchCount} matches
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {formatCurrency(winner.amountCents)} · proof {winner.proofStatus} · payout{" "}
                        {winner.paymentStatus}
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
                      >
                        Mark paid
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
