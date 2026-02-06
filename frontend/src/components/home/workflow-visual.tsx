import Image from "next/image"

import { Card } from "@/components/ui/card"
import { ArrowRight, Zap } from "lucide-react"

export function WorkflowVisual() {
  const steps = [
    {
      icon: "🎯",
      title: "Déclencheur",
      description: "Quand quelque chose se produit",
      color: "light-blue",
    },
    {
      icon: "⚡",
      title: "Traitement",
      description: "Transformer et filtrer les données",
      color: "mint",
    },
    {
      icon: "🚀",
      title: "Action",
      description: "Faire quelque chose automatiquement",
      color: "soft-yellow",
    },
  ]

  return (
    <section className="bg-transparent px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-mint/20 px-4 py-1.5 text-sm font-semibold text-navy dark:bg-mint/30 dark:text-white">
            <Zap className="h-4 w-4" />
            Créateur de Workflow Visuel
          </div>
          <h2 className="mb-4 text-balance text-4xl font-bold text-navy md:text-5xl dark:text-white">
            Créez de puissantes automatisations en quelques minutes
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Aucun codage requis. Notre créateur visuel intuitif facilite la création de workflows complexes qui connectent toutes
            vos applications favorites.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="group relative overflow-hidden border-2 border-border bg-card p-6 transition-all hover:border-light-blue hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-2xl transition-transform group-hover:scale-110 dark:bg-white/10">
                      {step.icon}
                    </div>
                    <div className="text-sm font-bold text-gray-300">{String(index + 1).padStart(2, "0")}</div>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-navy dark:text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </Card>

                {index < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <ArrowRight className="h-6 w-6 text-light-blue" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border-2 border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              <div className="flex-1">
                <h3 className="mb-2 text-2xl font-bold text-navy dark:text-white">Prêt à automatiser votre workflow ?</h3>
                <p className="text-muted-foreground">Rejoignez des milliers d&apos;équipes qui automatisent déjà avec AREA</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-light-blue/10 dark:bg-light-blue/20">
                  <Image src="/images/slack.svg" alt="Slack" width={24} height={24} className="h-6 w-6" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/10 dark:bg-mint/20">
                  <Image src="/images/discord.svg" alt="Discord" width={24} height={24} className="h-6 w-6" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-soft-yellow/20 dark:bg-soft-yellow/30">
                  <Image src="/images/notion.svg" alt="Notion" width={24} height={24} className="h-6 w-6" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-light-blue/10 dark:bg-light-blue/20">
                  <Image src="/images/gmail.svg" alt="Gmail" width={24} height={24} className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
