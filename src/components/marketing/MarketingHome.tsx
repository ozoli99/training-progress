// Server Component (no client hooks)
import Link from "next/link";

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top announcement bar */}
      <div className="w-full bg-primary/10 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-2 text-sm flex items-center justify-between">
          <span className="opacity-90">
            New: Athlete analytics and goal tracking just landed.
          </span>
          <Link href="/changelog" className="underline hover:opacity-80">
            Read changelog →
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              Train smarter. <span className="text-primary">See progress.</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Plan sessions, track results, and turn your training data into
              clear insights—volume, density, trends, and more.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Get started free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 border border-border hover:bg-accent transition"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="rounded-2xl border border-border p-4 md:p-6 shadow-sm">
            {/* Simple marketing “preview” card */}
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-sm text-muted-foreground">This week</div>
              <div className="mt-2 text-2xl font-semibold">4 sessions</div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Stat label="Volume" value="12,450 kg" />
                <Stat label="Duration" value="3h 10m" />
                <Stat label="Avg RPE" value="7.8" />
              </div>
              <div className="mt-6 h-24 rounded-md bg-accent/40 flex items-end gap-1 p-2">
                {/* Fake bars */}
                {[20, 60, 45, 80, 55, 30, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded bg-accent"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Rolling 7-day training volume
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-semibold">Why choose us</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Feature
            title="Data-driven insights"
            desc="Automatic KPIs, trends, and leaderboards to guide training decisions."
          />
          <Feature
            title="Flexible logging"
            desc="Strength sets, intervals, EMOMs, and free-form workouts—covered."
          />
          <Feature
            title="Team-ready"
            desc="Organizations, roles, and visibility controls built-in."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="rounded-2xl border border-border p-8 md:p-10 text-center">
          <h3 className="text-2xl md:text-3xl font-semibold">
            Start tracking smarter today
          </h3>
          <p className="mt-3 text-muted-foreground">
            Create your account and connect your first athletes in minutes.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              Create account
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 border border-border hover:bg-accent transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Chaos Labs</span>
          <nav className="flex gap-4">
            <Link href="/features" className="hover:underline">
              Features
            </Link>
            <Link href="/pricing" className="hover:underline">
              Pricing
            </Link>
            <Link href="/legal/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:underline">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-medium">{value}</div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border p-5">
      <div className="text-base font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
