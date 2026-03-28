"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export function AuthPanel() {
  const router = useRouter()
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  })

  async function handleSubmit() {
    try {
      setIsPending(true)
      setMessage(null)

      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          email: form.email,
          password: form.password,
          name: form.name,
        })

        if (result.error) {
          setMessage(result.error.message ?? "Unable to create account.")
          return
        }
      } else {
        const result = await authClient.signIn.email({
          email: form.email,
          password: form.password,
        })

        if (result.error) {
          setMessage(result.error.message ?? "Unable to sign in.")
          return
        }
      }

      router.push("/dashboard")
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.35em]">
          Better Auth
        </p>
        <CardTitle className="text-4xl">Create an account for Polar checkout.</CardTitle>
        <CardDescription className="text-base leading-7">
          Sign in or create an account first, then start the authenticated Polar
          subscription flow from the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted grid grid-cols-2 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === "sign-up"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === "sign-in"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Sign in
          </button>
        </div>
        <div className="space-y-4">
        {mode === "sign-up" ? (
          <div className="space-y-2">
            <label htmlFor="auth-name" className="text-sm font-medium">
              Full name
            </label>
            <Input
              id="auth-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Full name"
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <label htmlFor="auth-email" className="text-sm font-medium">
            Email address
          </label>
          <Input
            id="auth-email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="Email address"
            type="email"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="auth-password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="auth-password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="Password"
            type="password"
          />
        </div>
          {message ? (
            <div className="bg-muted text-muted-foreground rounded-md border px-4 py-3 text-sm">
              {message}
            </div>
          ) : null}
          <Button disabled={isPending} onClick={handleSubmit} className="h-11 w-full">
            {isPending ? "Working..." : mode === "sign-up" ? "Create account" : "Sign in"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
