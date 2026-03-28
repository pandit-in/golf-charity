import { Polar } from "@polar-sh/sdk"

import { upsertPublicSubscriber } from "@/lib/platform/service"

type PolarPlan = "monthly" | "yearly"

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export function isPolarConfigured() {
  return Boolean(
    process.env.POLAR_ACCESS_TOKEN &&
      process.env.POLAR_MONTHLY_PRODUCT_ID &&
      process.env.POLAR_YEARLY_PRODUCT_ID,
  )
}

export function getPolarServer() {
  return process.env.POLAR_SERVER === "production" ? "production" : "sandbox"
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  )
}

export function getPolarClient() {
  return new Polar({
    accessToken: requiredEnv("POLAR_ACCESS_TOKEN"),
    server: getPolarServer(),
  })
}

export function getPolarProductId(plan: PolarPlan) {
  return plan === "yearly"
    ? requiredEnv("POLAR_YEARLY_PRODUCT_ID")
    : requiredEnv("POLAR_MONTHLY_PRODUCT_ID")
}

export async function createPolarCheckoutUrl(input: {
  name: string
  email: string
  city: string
  charityId: string
  plan: PolarPlan
}) {
  const user = await upsertPublicSubscriber(input)
  const polar = getPolarClient()
  const appUrl = getAppUrl()
  const productId = getPolarProductId(input.plan)

  const checkout = await polar.checkouts.create({
    products: [productId],
    externalCustomerId: user.id,
    customerEmail: user.email,
    customerName: user.name,
    successUrl: `${appUrl}/subscribe/success`,
    returnUrl: `${appUrl}/`,
    metadata: {
      userId: user.id,
      plan: input.plan,
      charityId: input.charityId,
    },
  })

  return {
    userId: user.id,
    checkoutUrl: checkout.url,
  }
}

export async function createCustomerPortalUrl(customerId: string) {
  const polar = getPolarClient()
  const session = await polar.customerSessions.create({
    customerId,
    returnUrl: `${getAppUrl()}/dashboard`,
  })

  return session.customerPortalUrl
}
