import Link from "next/link"

export default function SubscribeSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071412] px-4 py-10 text-white">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/60">Subscription</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Checkout completed.</h1>
        <p className="mt-4 text-base leading-7 text-white/70">
          Polar will send the subscription events back to the app through webhooks. Once the webhook is configured with your real keys, subscriber access and renewal state will sync automatically.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-300 px-6 text-sm font-semibold text-emerald-950 hover:bg-emerald-200">
            Open subscriber dashboard
          </Link>
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white hover:bg-white/6">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
