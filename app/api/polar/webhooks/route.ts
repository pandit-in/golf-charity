import { Webhooks } from "@polar-sh/nextjs"
import { NextRequest, NextResponse } from "next/server"

import { updateUserSubscriptionFromPolar } from "@/lib/platform/service"

function getPlanFromProduct(productId: string | null | undefined) {
  if (!productId) {
    return undefined
  }

  if (productId === process.env.POLAR_YEARLY_PRODUCT_ID) {
    return "yearly" as const
  }

  if (productId === process.env.POLAR_MONTHLY_PRODUCT_ID) {
    return "monthly" as const
  }

  return undefined
}

const webhookHandler = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "missing-webhook-secret",
  onOrderPaid: async (payload) => {
    const plan =
      payload.data.metadata.plan === "yearly" || payload.data.metadata.plan === "monthly"
        ? payload.data.metadata.plan
        : getPlanFromProduct(payload.data.productId)

    await updateUserSubscriptionFromPolar({
      userId:
        typeof payload.data.metadata.userId === "string"
          ? payload.data.metadata.userId
          : undefined,
      customerId: payload.data.customerId,
      externalCustomerId: payload.data.customer.externalId,
      subscriptionId: payload.data.subscriptionId,
      checkoutId: payload.data.checkoutId,
      orderId: payload.data.id,
      productId: payload.data.productId,
      plan,
      status: payload.data.paid ? "active" : "inactive",
    })
  },
  onSubscriptionActive: async (payload) => {
    await updateUserSubscriptionFromPolar({
      customerId: payload.data.customerId,
      externalCustomerId: payload.data.customer.externalId,
      subscriptionId: payload.data.id,
      checkoutId: payload.data.checkoutId,
      productId: payload.data.productId,
      plan: getPlanFromProduct(payload.data.productId),
      status: "active",
      currentPeriodEnd: payload.data.currentPeriodEnd.toISOString(),
    })
  },
  onSubscriptionUpdated: async (payload) => {
    await updateUserSubscriptionFromPolar({
      customerId: payload.data.customerId,
      externalCustomerId: payload.data.customer.externalId,
      subscriptionId: payload.data.id,
      checkoutId: payload.data.checkoutId,
      productId: payload.data.productId,
      plan: getPlanFromProduct(payload.data.productId),
      status: payload.data.status === "active" ? "active" : "inactive",
      currentPeriodEnd: payload.data.currentPeriodEnd.toISOString(),
    })
  },
  onSubscriptionCanceled: async (payload) => {
    await updateUserSubscriptionFromPolar({
      customerId: payload.data.customerId,
      externalCustomerId: payload.data.customer.externalId,
      subscriptionId: payload.data.id,
      productId: payload.data.productId,
      status: "inactive",
      currentPeriodEnd: payload.data.currentPeriodEnd.toISOString(),
    })
  },
  onSubscriptionRevoked: async (payload) => {
    await updateUserSubscriptionFromPolar({
      customerId: payload.data.customerId,
      externalCustomerId: payload.data.customer.externalId,
      subscriptionId: payload.data.id,
      productId: payload.data.productId,
      status: "lapsed",
    })
  },
  onCustomerStateChanged: async (payload) => {
    const activeSubscription = payload.data.activeSubscriptions[0]
    await updateUserSubscriptionFromPolar({
      customerId: payload.data.id,
      externalCustomerId: payload.data.externalId,
      subscriptionId: activeSubscription?.id,
      productId: activeSubscription?.productId,
      plan: getPlanFromProduct(activeSubscription?.productId),
      status: activeSubscription ? "active" : "inactive",
      currentPeriodEnd: activeSubscription?.currentPeriodEnd?.toISOString() ?? null,
    })
  },
})

export async function POST(request: NextRequest) {
  if (!process.env.POLAR_WEBHOOK_SECRET) {
    return NextResponse.json(
      { received: false, error: "POLAR_WEBHOOK_SECRET is not configured." },
      { status: 500 },
    )
  }

  return webhookHandler(request)
}
