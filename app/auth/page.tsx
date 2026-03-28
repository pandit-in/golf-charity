import Link from "next/link"

import { AuthPanel } from "@/components/platform/auth-panel"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AuthPage() {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="mb-6 flex justify-center">
          <Link
            href="/"
            className="bg-background text-foreground hover:bg-muted rounded-md border px-4 py-2 text-sm"
          >
            Back home
          </Link>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <Card>
            <CardHeader>
              <p className="text-muted-foreground text-xs uppercase tracking-[0.35em]">
                Authenticated subscriptions
              </p>
              <CardTitle className="text-5xl leading-tight">
                Use Better Auth before launching Polar checkout.
              </CardTitle>
              <CardDescription className="max-w-xl text-base leading-8">
                This route uses the Better Auth + Polar plugin setup you provided,
                with Polar customer creation on sign-up and authenticated checkout
                enabled.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
          <AuthPanel />
        </div>
      </div>
    </main>
  )
}
