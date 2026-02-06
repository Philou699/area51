"use client"

import { Card } from "@/components/ui/card"
import { Server, Zap, Lock, Globe2, Clock, TrendingUp } from "lucide-react"

const specs = [
  {
    icon: Zap,
    title: "Performance",
    items: [
      { label: "Temps d'exécution", value: "<1 seconde" },
      { label: "Disponibilité garantie", value: "99.9%" },
      { label: "Requêtes par seconde", value: "10 000+" },
    ],
  },
  {
    icon: Server,
    title: "Infrastructure",
    items: [
      { label: "Régions", value: "Multi-régions" },
      { label: "Auto-scalabilité", value: "Automatique" },
      { label: "CDN", value: "Mondial" },
    ],
  },
  {
    icon: Lock,
    title: "Sécurité",
    items: [
      { label: "Chiffrement", value: "AES-256" },
      { label: "Conformité", value: "RGPD, ISO 27001" },
      { label: "Authentification", value: "OAuth 2.0" },
    ],
  },
  {
    icon: Globe2,
    title: "Disponibilité",
    items: [
      { label: "Centres de données", value: "UE, États-Unis, APAC" },
      { label: "Support", value: "24h/24 7j/7" },
      { label: "Langues", value: "15+" },
    ],
  },
  {
    icon: Clock,
    title: "Limites d&apos;utilisation",
    items: [
      { label: "Workflows", value: "Illimités" },
      { label: "Exécutions par mois", value: "100 000+" },
      { label: "Intégrations", value: "500+" },
    ],
  },
  {
    icon: TrendingUp,
    title: "Surveillance",
    items: [
      { label: "Logs temps réel", value: "Oui" },
      { label: "Analyses", value: "Avancées" },
      { label: "Alertes", value: "Personnalisables" },
    ],
  },
]

export function TechnicalSpecs() {
  return (
    <section className="bg-transparent px-4 py-24 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">Spécifications </span>
              <span className="bg-gradient-to-r from-soft-yellow to-light-blue bg-clip-text text-transparent">
                techniques
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une infrastructure résiliente conçue pour les automatisations critiques
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specs.map((spec, index) => {
              const Icon = spec.icon
              return (
                <Card key={index} className="p-6 border-2 hover:border-light-blue/50 transition-all hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-light-blue/10">
                      <Icon className="w-5 h-5 text-light-blue" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{spec.title}</h3>
                  </div>

                  <div className="space-y-3">
                    {spec.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-semibold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8">
            {["ISO 27001", "GDPR", "SOC 2", "HTTPS"].map((badge, i) => (
              <div key={i} className="px-6 py-3 rounded-lg bg-muted border-2 border-border">
                <span className="font-semibold text-foreground">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
