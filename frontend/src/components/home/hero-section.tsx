import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-transparent px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-light-blue/30 bg-light-blue/10 px-4 py-1.5 text-sm font-medium text-navy dark:border-light-blue/40 dark:bg-light-blue/10 dark:text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-light-blue opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-light-blue"></span>
            </span>
            Tous les services sont opérationnels
          </div>

          <h1 className="mb-6 text-balance text-5xl font-bold leading-tight tracking-tight text-navy md:text-6xl lg:text-7xl dark:text-white">
            Automatisez vos flux.{" "}
            <span className="bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent">
              Connectez tout.
            </span>
          </h1>

          <p className="mb-10 text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            La plateforme d’automatisation la plus puissante pour les équipes modernes. Connectez plus de 1 200 applications,
            créez des workflows intelligents et faites grandir votre activité sans écrire une ligne de code.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="group bg-navy text-white hover:bg-navy-dark dark:bg-light-blue dark:text-navy dark:hover:bg-light-blue-muted"
            >
              Commencer gratuitement
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="group border-navy text-navy hover:bg-navy/5 bg-transparent dark:border-light-blue dark:text-light-blue dark:hover:bg-light-blue/15"
            >
              <Play className="mr-2 h-4 w-4" />
              Voir la démo
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Aucune carte bancaire requise • Offre gratuite à vie • 14 jours d’essai des fonctionnalités premium
          </p>
        </div>
      </div>
    </section>
  )
}
