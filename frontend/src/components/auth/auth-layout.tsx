import type React from "react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  visualType: "login" | "register"
}

export function AuthLayout({ children, title, subtitle, visualType }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-navy-dark/95 dark:via-navy/90 dark:to-navy">
      <div className="pointer-events-none absolute -top-20 left-1/2 hidden h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-light-blue/30 blur-3xl sm:block dark:bg-light-blue/20" />
      <div className="pointer-events-none absolute -bottom-32 right-[-10%] hidden h-[520px] w-[520px] rounded-full bg-mint/25 blur-[120px] lg:block dark:bg-mint/15" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-12">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70 sm:inline-flex">
            AREA51
          </div>
        </header>

        <main className="grid flex-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div className="relative z-10">
            <div className="mb-8 space-y-3 text-center sm:text-left">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
              <p className="text-base text-muted-foreground sm:text-lg">{subtitle}</p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/95 p-7 shadow-xl backdrop-blur-sm transition dark:border-white/10 dark:bg-navy/60 sm:p-9">
              {children}
            </div>
          </div>

          <aside className="relative hidden h-full lg:flex">
            <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/80 via-light-blue-muted/40 to-mint-muted/40 p-10 shadow-xl shadow-light-blue/10 backdrop-blur-2xl dark:border-white/10 dark:from-white/5 dark:via-light-blue/10 dark:to-navy/60 lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(101,163,230,0.28),transparent_60%)] dark:bg-[radial-gradient(circle_at_22%_20%,rgba(101,163,230,0.35),transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_80%,rgba(115,217,186,0.25),transparent_55%)] dark:bg-[radial-gradient(circle_at_78%_80%,rgba(115,217,186,0.25),transparent_55%)]" />

              <div className="relative z-10">
                {visualType === "login" ? <LoginVisual /> : <RegisterVisual />}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}

function LoginVisual() {
  const workflows = [
    { name: "Email → Slack", status: "Actif", color: "bg-mint" },
    { name: "CRM Sync", status: "En cours", color: "bg-light-blue" },
    { name: "Pipeline Data", status: "Planifié", color: "bg-soft-yellow" },
  ] as const

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-3 text-center lg:text-left">
        <h3 className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">
          Vos automatisations vous attendent
        </h3>
        <p className="text-base text-muted-foreground dark:text-white/70">
          Retrouvez vos workflows en un instant et continuez à créer des expériences fluides.
        </p>
      </div>

      <div className="space-y-4">
        {workflows.map((workflow) => (
          <div
            key={workflow.name}
            className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${workflow.color} animate-pulse`} />
              <div>
                <p className="font-medium text-foreground dark:text-white">{workflow.name}</p>
                <p className="text-sm text-muted-foreground dark:text-white/60">{workflow.status}</p>
              </div>
            </div>
            <div className="text-sm font-medium text-muted-foreground/80 dark:text-white/50">→</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/80 p-5 text-sm shadow-sm backdrop-blur-sm dark:border-white/15 dark:bg-white/10 dark:text-white/80">
        <p>
          « AREA51 nous a permis de connecter nos équipes en quelques minutes. Les automatisations sont devenues un jeu
          d&apos;enfant. »
        </p>
        <p className="mt-3 font-semibold text-foreground dark:text-white">Clara B., Head of Ops</p>
      </div>
    </div>
  )
}

function RegisterVisual() {
  const stats = [
    { label: "Utilisateurs actifs", value: "50K+", gradient: "from-light-blue/90 to-mint/80" },
    { label: "Workflows créés", value: "2M+", gradient: "from-mint/80 to-soft-yellow/90" },
    { label: "Intégrations", value: "500+", gradient: "from-soft-yellow/90 to-light-blue/80" },
    { label: "Heures économisées", value: "10M+", gradient: "from-light-blue/90 to-mint/70" },
  ] as const

  return (
    <div className="w-full max-w-md space-y-10">
      <div className="space-y-3 text-center lg:text-left">
        <h3 className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">
          Rejoignez des milliers d&apos;équipes agiles
        </h3>
        <p className="text-base text-muted-foreground dark:text-white/70">
          Créez un compte et accédez à un espace conçu pour des expériences fluides et collaboratives.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/70 bg-white/90 p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/10"
          >
            <div
              className={`text-3xl font-semibold text-transparent ${
                stat.gradient
              } bg-clip-text bg-gradient-to-br`}
            >
              {stat.value}
            </div>
            <p className="mt-2 text-sm font-medium text-muted-foreground dark:text-white/60">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10">
        <p className="text-sm text-muted-foreground dark:text-white/70">
          Certifications & conformité
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/80 dark:text-white/60">
          {["SOC 2", "GDPR Ready", "ISO 27001", "99.9% Uptime"].map((badge) => (
            <span key={badge} className="rounded-full border border-current px-3 py-1">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
