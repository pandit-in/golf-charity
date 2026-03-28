"use server"

import { revalidatePath } from "next/cache"

import {
  addScore,
  adminUpdateUser,
  createCharity,
  markWinnerPaid,
  publishDraw,
  reviewWinner,
  simulateDraw,
  submitWinnerProof,
  updateProfile,
  updateCharitySelection,
} from "@/lib/platform/service"
import {
  createCustomerPortalUrl,
  createPolarCheckoutUrl,
  isPolarConfigured,
} from "@/lib/polar/client"

async function runAction(
  callback: () => Promise<void>,
  paths: string[],
  successMessage: string,
) {
  try {
    await callback()
    for (const path of paths) {
      revalidatePath(path)
    }

    return {
      ok: true,
      message: successMessage,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    }
  }
}

export async function addScoreAction(input: {
  userId: string
  date: string
  value: number
}) {
  return runAction(
    () => addScore(input),
    ["/", "/dashboard", "/admin"],
    "Score saved and rolling history updated.",
  )
}

export async function updateCharitySelectionAction(input: {
  userId: string
  charityId: string
  charityPercent: number
}) {
  return runAction(
    () => updateCharitySelection(input),
    ["/", "/dashboard", "/admin"],
    "Charity preference updated.",
  )
}

export async function submitWinnerProofAction(input: {
  drawId: string
  userId: string
  proofUrl: string
}) {
  return runAction(
    () => submitWinnerProof(input),
    ["/dashboard", "/admin"],
    "Winner proof submitted for review.",
  )
}

export async function simulateDrawAction(input: {
  drawId: string
  logic: "random" | "weighted"
}) {
  return runAction(
    () => simulateDraw(input),
    ["/", "/dashboard", "/admin"],
    "Draw simulation refreshed.",
  )
}

export async function publishDrawAction(drawId: string) {
  return runAction(
    () => publishDraw(drawId),
    ["/", "/dashboard", "/admin"],
    "Draw published and winners calculated.",
  )
}

export async function reviewWinnerAction(input: {
  drawId: string
  userId: string
  decision: "approved" | "rejected"
}) {
  return runAction(
    () => reviewWinner(input),
    ["/dashboard", "/admin"],
    "Winner review updated.",
  )
}

export async function markWinnerPaidAction(input: {
  drawId: string
  userId: string
}) {
  return runAction(
    () => markWinnerPaid(input),
    ["/dashboard", "/admin"],
    "Payout marked as completed.",
  )
}

export async function createCharityAction(input: {
  name: string
  description: string
  location: string
  upcomingEvent: string
  tags: string
  image: string
}) {
  return runAction(
    () => createCharity(input),
    ["/", "/dashboard", "/admin"],
    "Charity added to the directory.",
  )
}

export async function updateProfileAction(input: {
  userId: string
  name: string
  email: string
  city: string
  bio: string
  drawAlerts: boolean
  winnerAlerts: boolean
  marketingEmails: boolean
}) {
  return runAction(
    () => updateProfile(input),
    ["/", "/dashboard", "/admin"],
    "Profile and settings updated.",
  )
}

export async function adminUpdateUserAction(input: {
  userId: string
  name: string
  city: string
  plan: "monthly" | "yearly"
  subscriptionStatus: "active" | "inactive" | "lapsed"
  charityPercent: number
}) {
  return runAction(
    () => adminUpdateUser(input),
    ["/dashboard", "/admin"],
    "Subscriber settings updated.",
  )
}

export async function startSubscriptionCheckoutAction(input: {
  name: string
  email: string
  city: string
  charityId: string
  plan: "monthly" | "yearly"
}) {
  try {
    if (!isPolarConfigured()) {
      return {
        ok: false,
        message:
          "Polar is not configured yet. Add POLAR_ACCESS_TOKEN, POLAR_MONTHLY_PRODUCT_ID, POLAR_YEARLY_PRODUCT_ID, and NEXT_PUBLIC_APP_URL.",
      }
    }

    const result = await createPolarCheckoutUrl(input)
    revalidatePath("/")
    revalidatePath("/admin")

    return {
      ok: true,
      message: "Checkout created.",
      url: result.checkoutUrl,
      userId: result.userId,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to create checkout",
    }
  }
}

export async function openBillingPortalAction(input: { customerId: string }) {
  try {
    if (!isPolarConfigured()) {
      return {
        ok: false,
        message: "Polar is not configured yet.",
      }
    }

    const url = await createCustomerPortalUrl(input.customerId)
    return {
      ok: true,
      message: "Opening customer portal.",
      url,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to open billing portal",
    }
  }
}
