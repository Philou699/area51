"use client"

import { Zap, Shield, Workflow, Code2, Globe, Gauge } from "lucide-react"
import { Card } from "@/components/ui/card"

const capabilities = [
  {
    icon: Zap,
    title: "Automatisation intelligente",
    description: "Construisez des workflows complexes avec notre éditeur visuel intuitif. Glissez, déposez et reliez chaque étape.",
    color: "light-blue",
    features: ["Éditeur glisser-déposer", "Modèles prêts à l’emploi", "IA intégrée"],
  },
  {
    icon: Shield,
    title: "Sécurité d’entreprise",
    description: "Protégez vos données grâce au chiffrement AES-256, à OAuth 2.0 et à la conformité RGPD de bout en bout.",
    color: "mint",
    features: ["Chiffrement de bout en bout", "Audits réguliers", "ISO 27001"],
  },
  {
    icon: Workflow,
    title: "Logique avancée",
    description: "Conditions, boucles, filtres et transformations de données : tout ce qu’il faut pour une automatisation sur mesure.",
    color: "soft-yellow",
    features: ["Conditions Si/Alors/Sinon", "Boucles Pour chaque", "Filtres JSON"],
  },
  {
    icon: Code2,
    title: "API & webhooks",
    description: "Connectez n’importe quel service via des webhooks personnalisés et un SDK entièrement documenté.",
    color: "light-blue",
    features: ["API REST", "Webhooks", "SDK JavaScript"],
  },
  {
    icon: Globe,
    title: "Infrastructure multi-régions",
    description: "Une infrastructure mondiale distribuée conserve vos données dans la région que vous choisissez.",
    color: "mint",
    features: ["UE, États-Unis, APAC", "Latence <50 ms", "CDN mondial"],
  },
  {
    icon: Gauge,
    title: "Performance extrême",
    description: "Exécution instantanée, auto-scalabilité et supervision en temps réel pour chaque workflow.",
    color: "soft-yellow",
    features: ["<1 s d’exécution", "Auto-scalabilité", "Supervision 24/7"],
  },
]

export function CapabilitiesShowcase() {
  return (
    <section className="bg-transparent px-4 py-24 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">Tout ce dont vous avez besoin,</span>
              <br />
              <span className="bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent">
                et bien plus encore
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète qui évolue au rythme de vos ambitions
            </p>
          </div>

          {/* Bento grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon
              return (
                <Card
                  key={index}
                  className="group relative overflow-hidden border-2 hover:border-light-blue/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-6"
                >
                  {/* Gradient background on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-${capability.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />

                  <div className="relative">
                    <div className={`inline-flex p-3 rounded-xl bg-${capability.color}/10 mb-4`}>
                      <Icon className={`w-6 h-6 text-${capability.color}`} />
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-foreground">{capability.title}</h3>

                    <p className="text-muted-foreground mb-4 leading-relaxed">{capability.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {capability.features.map((feature, i) => (
                        <span
                          key={i}
                          className={`text-xs px-3 py-1 rounded-full bg-${capability.color}/10 text-foreground font-medium`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
