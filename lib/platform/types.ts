export type SubscriptionPlan = "monthly" | "yearly"
export type SubscriptionStatus = "active" | "inactive" | "lapsed"
export type UserRole = "subscriber" | "admin"
export type DrawLogic = "random" | "weighted"
export type DrawStatus = "draft" | "published"
export type PaymentStatus = "pending" | "paid"
export type ProofStatus = "missing" | "pending" | "approved" | "rejected"

export type ScoreEntry = {
  id: string
  date: string
  value: number
}

export type Charity = {
  id: string
  name: string
  slug: string
  description: string
  location: string
  tags: string[]
  featured: boolean
  image: string
  upcomingEvent: string
}

export type PlatformUser = {
  id: string
  name: string
  email: string
  city: string
  role: UserRole
  charityId: string
  bio?: string
  preferences?: {
    drawAlerts: boolean
    winnerAlerts: boolean
    marketingEmails: boolean
  }
  subscription: {
    plan: SubscriptionPlan
    status: SubscriptionStatus
    startedAt: string
    renewsAt: string
    amountCents: number
    charityPercent: number
    polarCustomerId?: string | null
    polarSubscriptionId?: string | null
    polarCheckoutId?: string | null
    polarProductId?: string | null
    latestOrderId?: string | null
  }
  scores: ScoreEntry[]
}

export type DrawWinner = {
  userId: string
  matchCount: 3 | 4 | 5
  amountCents: number
  paymentStatus: PaymentStatus
  proofStatus: ProofStatus
  proofUrl?: string
}

export type Draw = {
  id: string
  month: string
  status: DrawStatus
  logic: DrawLogic
  numbers: number[] | null
  simulatedNumbers: number[] | null
  publishedAt: string | null
  jackpotRolloverCents: number
  winners: DrawWinner[]
}

export type PlatformStore = {
  meta: {
    currency: string
    monthlyPriceCents: number
    yearlyPriceCents: number
    minimumCharityPercent: number
    prizePoolContributionPercent: number
  }
  charities: Charity[]
  users: PlatformUser[]
  draws: Draw[]
}

export type PublicSnapshot = {
  stats: {
    activeSubscribers: number
    totalRaisedCents: number
    totalPrizePoolCents: number
    monthlyJackpotCents: number
  }
  plans: {
    monthlyPriceCents: number
    yearlyPriceCents: number
    minimumCharityPercent: number
  }
  featuredCharity: Charity
  charities: Charity[]
  nextDraw: {
    month: string
    logic: DrawLogic
    simulatedNumbers: number[] | null
  }
  recentWinners: Array<{
    drawMonth: string
    userName: string
    matchCount: number
    amountCents: number
  }>
}

export type DashboardSnapshot = {
  viewer: {
    id: string
    name: string
    email: string
    city: string
    bio?: string
    preferences: {
      drawAlerts: boolean
      winnerAlerts: boolean
      marketingEmails: boolean
    }
  }
  subscription: PlatformUser["subscription"]
  selectedCharity: Charity
  charities: Charity[]
  scores: ScoreEntry[]
  recentDraws: Array<{
    id: string
    month: string
    status: DrawStatus
    logic: DrawLogic
    numbers: number[] | null
    simulatedNumbers: number[] | null
    result: {
      matchCount: number
      amountCents: number
      paymentStatus: PaymentStatus
      proofStatus: ProofStatus
      proofUrl?: string
    } | null
  }>
  participation: {
    drawsEntered: number
    upcomingDrawMonth: string
    upcomingDrawNumbers: number[] | null
  }
  winnings: {
    totalWonCents: number
    pendingCents: number
    paidCents: number
  }
  billing: {
    polarLinked: boolean
    portalAvailable: boolean
    plans: {
      monthlyPriceCents: number
      yearlyPriceCents: number
    }
  }
}

export type AdminSnapshot = {
  analytics: {
    totalUsers: number
    activeSubscribers: number
    totalPrizePoolCents: number
    totalCharityCents: number
    jackpotRolloverCents: number
  }
  users: Array<{
    id: string
    name: string
    email: string
    city: string
    bio?: string
    subscriptionStatus: SubscriptionStatus
    plan: SubscriptionPlan
    charityPercent: number
    charityName: string
    latestScore: number | null
    polarLinked: boolean
  }>
  draws: Draw[]
  charities: Charity[]
  winnerReviews: Array<{
    drawId: string
    drawMonth: string
    userId: string
    userName: string
    matchCount: number
    amountCents: number
    paymentStatus: PaymentStatus
    proofStatus: ProofStatus
    proofUrl?: string
  }>
}
