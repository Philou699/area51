import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export function CTASection() {
  const benefits = ["Aucune carte bancaire requise", "Plan gratuit à vie disponible", "Annulation possible à tout moment", "Support 24h/24 7j/7"]

  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[20%] top-16 h-[28rem] w-[28rem] rounded-full bg-light-blue/20 blur-3xl dark:bg-light-blue/25" />
        <div className="absolute right-[18%] bottom-16 h-[26rem] w-[26rem] rounded-full bg-mint/20 blur-3xl dark:bg-mint/25" />
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[120px] dark:bg-secondary/15" />
      </div>

      <div className="container mx-auto">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-white/60 bg-white/75 px-10 py-16 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-6 text-balance text-4xl font-bold text-navy md:text-5xl dark:text-white">
            Prêt à transformer votre flux de travail ?
          </h2>
          <p className="mb-10 text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl dark:text-white/80">
            Rejoignez plus de 100 000 équipes qui automatisent déjà leur travail avec AREA. Commencez à créer des flux de travail puissants en
            quelques minutes.
          </p>

          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
              className="border-navy text-navy hover:bg-navy/5 bg-transparent dark:border-white/30 dark:text-white dark:hover:bg-white/10"
            >
              Programmer une démo
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground dark:text-white/80">
                <CheckCircle2 className="h-4 w-4 text-mint dark:text-mint" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
