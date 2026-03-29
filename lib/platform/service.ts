import { randomUUID } from "node:crypto"

import { z } from "zod"

import { readPlatformStore, writePlatformStore } from "@/lib/platform/store"
import type {
  AdminSnapshot,
  Charity,
  DashboardSnapshot,
  Draw,
  DrawLogic,
  DrawWinner,
  PlatformStore,
  PlatformUser,
  PublicSnapshot,
} from "@/lib/platform/types"

const scoreSchema = z.object({
  userId: z.string().min(1),
  date: z.string().date(),
  value: z.number().int().min(1).max(45),
})

const charitySelectionSchema = z.object({
  userId: z.string().min(1),
  charityId: z.string().min(1),
  charityPercent: z.number().int().min(10).max(100),
})

const proofSchema = z.object({
  drawId: z.string().min(1),
  userId: z.string().min(1),
  proofUrl: z.string().url(),
})

const simulateSchema = z.object({
  drawId: z.string().min(1),
  logic: z.enum(["random", "weighted"]),
})

const reviewSchema = z.object({
  drawId: z.string().min(1),
  userId: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
})

const payoutSchema = z.object({
  drawId: z.string().min(1),
  userId: z.string().min(1),
})

const charitySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(20),
  location: z.string().min(2),
  upcomingEvent: z.string().min(2),
  tags: z.string().min(2),
  image: z.string().url(),
})

const profileSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  city: z.string().min(2),
  bio: z.string().min(12),
  drawAlerts: z.boolean(),
  winnerAlerts: z.boolean(),
  marketingEmails: z.boolean(),
})

const adminUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2),
  city: z.string().min(2),
  plan: z.enum(["monthly", "yearly"]),
  subscriptionStatus: z.enum(["active", "inactive", "lapsed"]),
  charityPercent: z.number().int().min(10).max(100),
})

const publicSubscriberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  city: z.string().min(2),
  charityId: z.string().min(1),
  plan: z.enum(["monthly", "yearly"]),
})

function getActiveSubscribers(store: PlatformStore) {
  return store.users.filter(
    (user) => user.role === "subscriber" && user.subscription.status === "active",
  )
}

function ensureUserDefaults(user: PlatformUser) {
  user.preferences ??= {
    drawAlerts: true,
    winnerAlerts: true,
    marketingEmails: false,
  }
  user.bio ??= ""
  user.subscription.polarCustomerId ??= null
  user.subscription.polarSubscriptionId ??= null
  user.subscription.polarCheckoutId ??= null
  user.subscription.polarProductId ??= null
  user.subscription.latestOrderId ??= null
}

function getUserOrThrow(store: PlatformStore, userId: string) {
  const user = store.users.find((entry) => entry.id === userId)
  if (!user) {
    throw new Error("User not found")
  }
  return user
}

function getUserByEmail(store: PlatformStore, email: string) {
  return store.users.find(
    (entry) => entry.email.toLowerCase() === email.toLowerCase(),
  )
}

function buildPlatformUserFromAuthProfile(
  store: PlatformStore,
  input: {
    authUserId: string
    name: string
    email: string
  },
): PlatformUser {
  const defaultCharity = store.charities.find((charity) => charity.featured) ?? store.charities[0]
  const today = new Date().toISOString().slice(0, 10)

  return {
    id: input.authUserId,
    name: input.name,
    email: input.email,
    city: "",
    role: "subscriber",
    charityId: defaultCharity.id,
    bio: "",
    preferences: {
      drawAlerts: true,
      winnerAlerts: true,
      marketingEmails: false,
    },
    subscription: {
      plan: "monthly",
      status: "inactive",
      startedAt: today,
      renewsAt: today,
      amountCents: store.meta.monthlyPriceCents,
      charityPercent: store.meta.minimumCharityPercent,
      polarCustomerId: null,
      polarSubscriptionId: null,
      polarCheckoutId: null,
      polarProductId: null,
      latestOrderId: null,
    },
    scores: [],
  }
}

function upsertPlatformUserFromAuthProfile(
  store: PlatformStore,
  input: {
    authUserId: string
    name: string
    email: string
  },
) {
  const existingUser = getUserByEmail(store, input.email)

  if (existingUser) {
    ensureUserDefaults(existingUser)
    existingUser.name = input.name
    existingUser.email = input.email
    return existingUser
  }

  const createdUser = buildPlatformUserFromAuthProfile(store, input)
  store.users.push(createdUser)
  return createdUser
}

function getDrawOrThrow(store: PlatformStore, drawId: string) {
  const draw = store.draws.find((entry) => entry.id === drawId)
  if (!draw) {
    throw new Error("Draw not found")
  }
  return draw
}

function getCharityOrThrow(store: PlatformStore, charityId: string) {
  const charity = store.charities.find((entry) => entry.id === charityId)
  if (!charity) {
    throw new Error("Charity not found")
  }
  return charity
}

function getPrizePoolContribution(user: PlatformUser, percent: number) {
  return Math.round((user.subscription.amountCents * percent) / 100)
}

function getTotalPrizePoolCents(store: PlatformStore) {
  return getActiveSubscribers(store).reduce((sum, user) => {
    return sum + getPrizePoolContribution(user, store.meta.prizePoolContributionPercent)
  }, 0)
}

function getTotalCharityCents(store: PlatformStore) {
  return getActiveSubscribers(store).reduce((sum, user) => {
    return sum + getPrizePoolContribution(user, user.subscription.charityPercent)
  }, 0)
}

function sortScoresDescending(user: PlatformUser) {
  user.scores.sort((left, right) => right.date.localeCompare(left.date))
}

function buildFrequencyMap(store: PlatformStore) {
  const frequency = new Map<number, number>()
  for (const user of getActiveSubscribers(store)) {
    for (const score of user.scores) {
      frequency.set(score.value, (frequency.get(score.value) ?? 0) + 1)
    }
  }
  return frequency
}

function generateWeightedNumbers(store: PlatformStore) {
  const frequency = buildFrequencyMap(store)
  const pool = Array.from({ length: 45 }, (_, index) => {
    const value = index + 1
    return {
      value,
      weight: (frequency.get(value) ?? 0) + 1,
    }
  })

  const picks: number[] = []
  while (picks.length < 5 && pool.length > 0) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0)
    let target = Math.random() * totalWeight
    const foundIndex = pool.findIndex((item) => {
      target -= item.weight
      return target <= 0
    })
    const index = foundIndex >= 0 ? foundIndex : 0
    picks.push(pool[index].value)
    pool.splice(index, 1)
  }

  return picks.sort((left, right) => left - right)
}

function generateRandomNumbers() {
  const pool = Array.from({ length: 45 }, (_, index) => index + 1)
  const picks: number[] = []
  while (picks.length < 5) {
    const index = Math.floor(Math.random() * pool.length)
    picks.push(pool[index])
    pool.splice(index, 1)
  }
  return picks.sort((left, right) => left - right)
}

function resolveDrawNumbers(store: PlatformStore, logic: DrawLogic) {
  return logic === "weighted" ? generateWeightedNumbers(store) : generateRandomNumbers()
}

function calculateDrawWinners(store: PlatformStore, draw: Draw, numbers: number[]) {
  const activeSubscribers = getActiveSubscribers(store)
  const totalPrizePoolCents = getTotalPrizePoolCents(store)
  const tierPools = {
    5: Math.round(totalPrizePoolCents * 0.4) + draw.jackpotRolloverCents,
    4: Math.round(totalPrizePoolCents * 0.35),
    3: Math.round(totalPrizePoolCents * 0.25),
  }

  const qualifying = activeSubscribers
    .map((user) => {
      const scoreSet = new Set(user.scores.map((score) => score.value))
      const matchCount = numbers.filter((value) => scoreSet.has(value)).length
      return {
        userId: user.id,
        matchCount,
      }
    })
    .filter((result) => result.matchCount >= 3)

  const winners: DrawWinner[] = qualifying.map((result) => {
    const winnersInTier = qualifying.filter(
      (entry) => entry.matchCount === result.matchCount,
    ).length

    return {
      userId: result.userId,
      matchCount: result.matchCount as 3 | 4 | 5,
      amountCents:
        tierPools[result.matchCount as 3 | 4 | 5] && winnersInTier > 0
          ? Math.floor(tierPools[result.matchCount as 3 | 4 | 5] / winnersInTier)
          : 0,
      paymentStatus: "pending",
      proofStatus: "missing",
    }
  })

  return {
    winners,
    nextJackpotRolloverCents: winners.some((winner) => winner.matchCount === 5)
      ? 0
      : tierPools[5],
  }
}

export async function getPublicSnapshot(): Promise<PublicSnapshot> {
  const store = await readPlatformStore()
  const featuredCharity =
    store.charities.find((charity) => charity.featured) ?? store.charities[0]
  const nextDraw = store.draws.find((draw) => draw.status === "draft") ?? store.draws[0]

  return {
    stats: {
      activeSubscribers: getActiveSubscribers(store).length,
      totalRaisedCents: getTotalCharityCents(store),
      totalPrizePoolCents: getTotalPrizePoolCents(store),
      monthlyJackpotCents:
        nextDraw.jackpotRolloverCents +
        Math.round(getTotalPrizePoolCents(store) * 0.4),
    },
    plans: {
      monthlyPriceCents: store.meta.monthlyPriceCents,
      yearlyPriceCents: store.meta.yearlyPriceCents,
      minimumCharityPercent: store.meta.minimumCharityPercent,
    },
    featuredCharity,
    charities: store.charities,
    nextDraw: {
      month: nextDraw.month,
      logic: nextDraw.logic,
      simulatedNumbers: nextDraw.simulatedNumbers,
    },
    recentWinners: store.draws
      .filter((draw) => draw.status === "published")
      .flatMap((draw) =>
        draw.winners.map((winner) => ({
          drawMonth: draw.month,
          userName: getUserOrThrow(store, winner.userId).name,
          matchCount: winner.matchCount,
          amountCents: winner.amountCents,
        })),
      )
      .slice(0, 4),
  }
}

export async function getDashboardSnapshot(userId: string): Promise<DashboardSnapshot> {
  const store = await readPlatformStore()
  const user = getUserOrThrow(store, userId)
  ensureUserDefaults(user)
  const selectedCharity = getCharityOrThrow(store, user.charityId)
  const recentDraws = store.draws
    .slice()
    .sort((left, right) => right.month.localeCompare(left.month))
    .map((draw) => {
      const winner = draw.winners.find((entry) => entry.userId === user.id) ?? null
      return {
        id: draw.id,
        month: draw.month,
        status: draw.status,
        logic: draw.logic,
        numbers: draw.numbers,
        simulatedNumbers: draw.simulatedNumbers,
        result: winner
          ? {
              matchCount: winner.matchCount,
              amountCents: winner.amountCents,
              paymentStatus: winner.paymentStatus,
              proofStatus: winner.proofStatus,
              proofUrl: winner.proofUrl,
            }
          : null,
      }
    })

  const winnings = recentDraws.reduce(
    (accumulator, draw) => {
      if (!draw.result) {
        return accumulator
      }

      accumulator.totalWonCents += draw.result.amountCents
      if (draw.result.paymentStatus === "paid") {
        accumulator.paidCents += draw.result.amountCents
      } else {
        accumulator.pendingCents += draw.result.amountCents
      }
      return accumulator
    },
    {
      totalWonCents: 0,
      pendingCents: 0,
      paidCents: 0,
    },
  )

  const upcomingDraw = recentDraws.find((draw) => draw.status === "draft") ?? recentDraws[0]

  return {
    viewer: {
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city,
      bio: user.bio,
      preferences:
        user.preferences ??
        ({
          drawAlerts: true,
          winnerAlerts: true,
          marketingEmails: false,
        } as const),
    },
    subscription: user.subscription,
    selectedCharity,
    charities: store.charities,
    scores: user.scores.slice().sort((left, right) => right.date.localeCompare(left.date)),
    recentDraws,
    participation: {
      drawsEntered: recentDraws.length,
      upcomingDrawMonth: upcomingDraw.month,
      upcomingDrawNumbers: upcomingDraw.simulatedNumbers,
    },
    winnings,
    billing: {
      polarLinked: Boolean(user.subscription.polarCustomerId),
      portalAvailable: Boolean(user.subscription.polarCustomerId),
      plans: {
        monthlyPriceCents: store.meta.monthlyPriceCents,
        yearlyPriceCents: store.meta.yearlyPriceCents,
      },
    },
  }
}

export async function getOrCreateDashboardSnapshotForAuthUser(input: {
  authUserId: string
  name: string
  email: string
}): Promise<DashboardSnapshot> {
  const store = await readPlatformStore()
  const user = upsertPlatformUserFromAuthProfile(store, input)
  await writePlatformStore(store)
  return getDashboardSnapshot(user.id)
}

export async function syncAuthUsersToPlatformStore(
  authUsers: Array<{
    id: string
    name: string
    email: string
  }>,
) {
  const store = await readPlatformStore()

  for (const authUser of authUsers) {
    upsertPlatformUserFromAuthProfile(store, {
      authUserId: authUser.id,
      name: authUser.name,
      email: authUser.email,
    })
  }

  await writePlatformStore(store)
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  const store = await readPlatformStore()

  return {
    analytics: {
      totalUsers: store.users.filter((user) => user.role === "subscriber").length,
      activeSubscribers: getActiveSubscribers(store).length,
      totalPrizePoolCents: getTotalPrizePoolCents(store),
      totalCharityCents: getTotalCharityCents(store),
      jackpotRolloverCents: store.draws.reduce(
        (sum, draw) => sum + draw.jackpotRolloverCents,
        0,
      ),
    },
    users: store.users
      .filter((user) => user.role === "subscriber")
      .map((user) => {
        ensureUserDefaults(user)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          city: user.city,
          bio: user.bio,
          subscriptionStatus: user.subscription.status,
          plan: user.subscription.plan,
          charityPercent: user.subscription.charityPercent,
          charityName: getCharityOrThrow(store, user.charityId).name,
          latestScore: user.scores[0]?.value ?? null,
          polarLinked: Boolean(user.subscription.polarCustomerId),
        }
      }),
    draws: store.draws.slice().sort((left, right) => right.month.localeCompare(left.month)),
    charities: store.charities,
    winnerReviews: store.draws.flatMap((draw) =>
      draw.winners.map((winner) => ({
        drawId: draw.id,
        drawMonth: draw.month,
        userId: winner.userId,
        userName: getUserOrThrow(store, winner.userId).name,
        matchCount: winner.matchCount,
        amountCents: winner.amountCents,
        paymentStatus: winner.paymentStatus,
        proofStatus: winner.proofStatus,
        proofUrl: winner.proofUrl,
      })),
    ),
  }
}

export async function addScore(input: unknown) {
  const payload = scoreSchema.parse(input)
  const store = await readPlatformStore()
  const user = getUserOrThrow(store, payload.userId)

  user.scores.push({
    id: randomUUID(),
    date: payload.date,
    value: payload.value,
  })
  sortScoresDescending(user)
  user.scores = user.scores.slice(0, 5)

  await writePlatformStore(store)
}

export async function updateCharitySelection(input: unknown) {
  const payload = charitySelectionSchema.parse(input)
  const store = await readPlatformStore()
  const user = getUserOrThrow(store, payload.userId)

  getCharityOrThrow(store, payload.charityId)
  user.charityId = payload.charityId
  user.subscription.charityPercent = payload.charityPercent

  await writePlatformStore(store)
}

export async function submitWinnerProof(input: unknown) {
  const payload = proofSchema.parse(input)
  const store = await readPlatformStore()
  const draw = getDrawOrThrow(store, payload.drawId)
  const winner = draw.winners.find((entry) => entry.userId === payload.userId)

  if (!winner) {
    throw new Error("Winner entry not found")
  }

  winner.proofUrl = payload.proofUrl
  winner.proofStatus = "pending"

  await writePlatformStore(store)
}

export async function simulateDraw(input: unknown) {
  const payload = simulateSchema.parse(input)
  const store = await readPlatformStore()
  const draw = getDrawOrThrow(store, payload.drawId)

  draw.logic = payload.logic
  draw.simulatedNumbers = resolveDrawNumbers(store, payload.logic)

  await writePlatformStore(store)
}

export async function publishDraw(drawId: string) {
  const store = await readPlatformStore()
  const draw = getDrawOrThrow(store, drawId)
  const numbers = draw.simulatedNumbers ?? resolveDrawNumbers(store, draw.logic)
  const results = calculateDrawWinners(store, draw, numbers)

  draw.status = "published"
  draw.numbers = numbers
  draw.simulatedNumbers = numbers
  draw.publishedAt = new Date().toISOString()
  draw.winners = results.winners

  const nextMonth = new Date(`${draw.month}-01T00:00:00`)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const nextMonthKey = `${nextMonth.getFullYear()}-${String(
    nextMonth.getMonth() + 1,
  ).padStart(2, "0")}`

  const existingNextDraft = store.draws.find((entry) => entry.month === nextMonthKey)
  if (existingNextDraft) {
    existingNextDraft.jackpotRolloverCents = results.nextJackpotRolloverCents
  } else {
    store.draws.push({
      id: `draw-${nextMonthKey}`,
      month: nextMonthKey,
      status: "draft",
      logic: draw.logic,
      numbers: null,
      simulatedNumbers: null,
      publishedAt: null,
      jackpotRolloverCents: results.nextJackpotRolloverCents,
      winners: [],
    })
  }

  await writePlatformStore(store)
}

export async function reviewWinner(input: unknown) {
  const payload = reviewSchema.parse(input)
  const store = await readPlatformStore()
  const draw = getDrawOrThrow(store, payload.drawId)
  const winner = draw.winners.find((entry) => entry.userId === payload.userId)

  if (!winner) {
    throw new Error("Winner entry not found")
  }

  winner.proofStatus = payload.decision
  await writePlatformStore(store)
}

export async function markWinnerPaid(input: unknown) {
  const payload = payoutSchema.parse(input)
  const store = await readPlatformStore()
  const draw = getDrawOrThrow(store, payload.drawId)
  const winner = draw.winners.find((entry) => entry.userId === payload.userId)

  if (!winner) {
    throw new Error("Winner entry not found")
  }

  winner.paymentStatus = "paid"
  await writePlatformStore(store)
}

export async function createCharity(input: unknown) {
  const payload = charitySchema.parse(input)
  const store = await readPlatformStore()
  const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  const charity: Charity = {
    id: `charity-${slug}`,
    slug,
    name: payload.name,
    description: payload.description,
    location: payload.location,
    upcomingEvent: payload.upcomingEvent,
    image: payload.image,
    tags: payload.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    featured: false,
  }

  store.charities.unshift(charity)
  await writePlatformStore(store)
}

export async function updateProfile(input: unknown) {
  const payload = profileSchema.parse(input)
  const store = await readPlatformStore()
  const user = getUserOrThrow(store, payload.userId)
  ensureUserDefaults(user)

  user.name = payload.name
  user.email = payload.email
  user.city = payload.city
  user.bio = payload.bio
  user.preferences = {
    drawAlerts: payload.drawAlerts,
    winnerAlerts: payload.winnerAlerts,
    marketingEmails: payload.marketingEmails,
  }

  await writePlatformStore(store)
}

export async function adminUpdateUser(input: unknown) {
  const payload = adminUserSchema.parse(input)
  const store = await readPlatformStore()
  const user = getUserOrThrow(store, payload.userId)
  ensureUserDefaults(user)

  user.name = payload.name
  user.city = payload.city
  user.subscription.plan = payload.plan
  user.subscription.status = payload.subscriptionStatus
  user.subscription.charityPercent = payload.charityPercent
  user.subscription.amountCents =
    payload.plan === "yearly"
      ? store.meta.yearlyPriceCents
      : store.meta.monthlyPriceCents

  await writePlatformStore(store)
}

export async function upsertPublicSubscriber(input: unknown) {
  const payload = publicSubscriberSchema.parse(input)
  const store = await readPlatformStore()
  getCharityOrThrow(store, payload.charityId)

  const existingUser = store.users.find((user) => user.email === payload.email)
  if (existingUser) {
    existingUser.name = payload.name
    existingUser.city = payload.city
    existingUser.charityId = payload.charityId
    existingUser.subscription.plan = payload.plan
    existingUser.subscription.amountCents =
      payload.plan === "yearly"
        ? store.meta.yearlyPriceCents
        : store.meta.monthlyPriceCents
    ensureUserDefaults(existingUser)
    await writePlatformStore(store)
    return existingUser
  }

  const createdUser: PlatformUser = {
    id: `user-${randomUUID().slice(0, 8)}`,
    name: payload.name,
    email: payload.email,
    city: payload.city,
    role: "subscriber",
    charityId: payload.charityId,
    bio: "New subscriber created from the public checkout flow.",
    preferences: {
      drawAlerts: true,
      winnerAlerts: true,
      marketingEmails: true,
    },
    subscription: {
      plan: payload.plan,
      status: "inactive",
      startedAt: new Date().toISOString().slice(0, 10),
      renewsAt: new Date().toISOString().slice(0, 10),
      amountCents:
        payload.plan === "yearly"
          ? store.meta.yearlyPriceCents
          : store.meta.monthlyPriceCents,
      charityPercent: store.meta.minimumCharityPercent,
      polarCustomerId: null,
      polarSubscriptionId: null,
      polarCheckoutId: null,
      polarProductId: null,
      latestOrderId: null,
    },
    scores: [],
  }

  store.users.push(createdUser)
  await writePlatformStore(store)
  return createdUser
}

export async function updateUserSubscriptionFromPolar(input: {
  userId?: string
  customerId?: string | null
  externalCustomerId?: string | null
  subscriptionId?: string | null
  checkoutId?: string | null
  orderId?: string | null
  productId?: string | null
  plan?: "monthly" | "yearly"
  status?: "active" | "inactive" | "lapsed"
  currentPeriodEnd?: string | null
}) {
  const store = await readPlatformStore()
  const user =
    (input.userId ? store.users.find((entry) => entry.id === input.userId) : undefined) ??
    (input.externalCustomerId
      ? store.users.find((entry) => entry.id === input.externalCustomerId)
      : undefined) ??
    (input.customerId
      ? store.users.find((entry) => entry.subscription.polarCustomerId === input.customerId)
      : undefined)

  if (!user) {
    return
  }

  ensureUserDefaults(user)
  if (input.customerId) {
    user.subscription.polarCustomerId = input.customerId
  }
  if (input.subscriptionId) {
    user.subscription.polarSubscriptionId = input.subscriptionId
  }
  if (input.checkoutId) {
    user.subscription.polarCheckoutId = input.checkoutId
  }
  if (input.orderId) {
    user.subscription.latestOrderId = input.orderId
  }
  if (input.productId) {
    user.subscription.polarProductId = input.productId
  }
  if (input.plan) {
    user.subscription.plan = input.plan
    user.subscription.amountCents =
      input.plan === "yearly"
        ? store.meta.yearlyPriceCents
        : store.meta.monthlyPriceCents
  }
  if (input.status) {
    user.subscription.status = input.status
  }
  if (input.currentPeriodEnd) {
    user.subscription.renewsAt = input.currentPeriodEnd.slice(0, 10)
  }
  if (input.status === "active") {
    user.subscription.startedAt =
      user.subscription.startedAt || new Date().toISOString().slice(0, 10)
  }

  await writePlatformStore(store)
}
