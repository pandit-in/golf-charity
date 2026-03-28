import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth"
import { Polar } from "@polar-sh/sdk"
import { betterAuth } from "better-auth"

import { db } from "@/lib/db"
import { authSchema } from "@/lib/db/schema"
import { updateUserSubscriptionFromPolar } from "@/lib/platform/service"

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
})

function resolvePlan(productId: string | null | undefined) {
  if (productId === process.env.POLAR_YEARLY_PRODUCT_ID) {
    return "yearly" as const
  }
  if (productId === process.env.POLAR_MONTHLY_PRODUCT_ID) {
    return "monthly" as const
  }
  return undefined
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-better-auth-secret",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId:
                process.env.POLAR_MONTHLY_PRODUCT_ID ??
                "42699dd8-713b-426d-9e12-a4d16c9038b2",
              slug: "golf-charity",
            },
            ...(process.env.POLAR_YEARLY_PRODUCT_ID
              ? [
                  {
                    productId: process.env.POLAR_YEARLY_PRODUCT_ID,
                    slug: "golf-charity-yearly",
                  },
                ]
              : []),
          ],
          successUrl: "/subscribe/success?checkout_id={CHECKOUT_ID}",
          returnUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          authenticatedUsersOnly: true,
        }),
        portal({
          returnUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000/dashboard",
        }),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET ?? "",
          onOrderPaid: async (payload) => {
            await updateUserSubscriptionFromPolar({
              externalCustomerId: payload.data.customer.externalId,
              customerId: payload.data.customerId,
              subscriptionId: payload.data.subscriptionId,
              checkoutId: payload.data.checkoutId,
              orderId: payload.data.id,
              productId: payload.data.productId,
              plan: resolvePlan(payload.data.productId),
              status: payload.data.paid ? "active" : "inactive",
            })
          },
          onCustomerStateChanged: async (payload) => {
            const activeSubscription = payload.data.activeSubscriptions[0]
            await updateUserSubscriptionFromPolar({
              externalCustomerId: payload.data.externalId,
              customerId: payload.data.id,
              subscriptionId: activeSubscription?.id,
              productId: activeSubscription?.productId,
              plan: resolvePlan(activeSubscription?.productId),
              status: activeSubscription ? "active" : "inactive",
              currentPeriodEnd: activeSubscription?.currentPeriodEnd?.toISOString() ?? null,
            })
          },
        }),
      ],
    }),
  ],
})
