import { Card } from "@/components/ui/card"
import { Zap, Shield, Code, Users, BarChart3, Sparkles } from "lucide-react"

export function FeaturesGrid() {
  const features = [
    {
      icon: Zap,
      title: "Ultra Rapide",
      description: "Exécutez vos flux de travail en millisecondes grâce à notre infrastructure optimisée.",
      color: "light-blue",
    },
    {
      icon: Shield,
      title: "Sécurité Entreprise",
      description: "Conforme SOC 2 avec chiffrement de bout en bout et contrôles d&apos;accès avancés.",
      color: "mint",
    },
    {
      icon: Code,
      title: "Développeur-Friendly",
      description: "Accès API complet, webhooks et support de code personnalisé pour les cas d&apos;usage avancés.",
      color: "soft-yellow",
    },
    {
      icon: Users,
      title: "Collaboration d&apos;Équipe",
      description: "Partagez vos flux de travail, gérez les permissions et collaborez en temps réel.",
      color: "light-blue",
    },
    {
      icon: BarChart3,
      title: "Analyses Avancées",
      description: "Suivez les performances, surveillez les erreurs et optimisez vos automatisations.",
      color: "mint",
    },
    {
      icon: Sparkles,
      title: "Propulsé par l&apos;IA",
      description: "Suggestions intelligentes et assistance IA pour créer des flux de travail plus rapidement.",
      color: "soft-yellow",
    },
  ]

  return (
    <section id="features" className="bg-transparent px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-4xl font-bold text-navy md:text-5xl dark:text-white">
            Tout ce dont vous avez besoin pour automatiser
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Des fonctionnalités puissantes conçues pour les équipes de toutes tailles. Des startups aux entreprises, nous avons les outils dont vous avez besoin
            pour réussir.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="group border-2 border-border bg-card p-8 transition-all hover:border-light-blue hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-light-blue/10 transition-transform group-hover:scale-110 dark:bg-light-blue/20">
                  <Icon className="h-6 w-6 text-light-blue" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-navy dark:text-white">{feature.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{feature.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
