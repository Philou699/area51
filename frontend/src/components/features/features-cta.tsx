"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export function FeaturesCTA() {
  return (
    <section className="relative overflow-hidden px-4 py-24 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-light-blue/10 via-mint/10 to-soft-yellow/10 -z-10" />

      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 border border-mint/20 mb-6">
          <Sparkles className="w-4 h-4 text-mint" />
          <span className="text-sm font-medium text-foreground">Prêt à transformer votre flux de travail ?</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="text-foreground">Commencez à automatiser </span>
          <span className="bg-gradient-to-r from-light-blue via-mint to-soft-yellow bg-clip-text text-transparent">
            dès aujourd&apos;hui
          </span>
        </h2>

        <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
          Rejoignez des milliers d&apos;équipes qui automatisent déjà leurs processus et récupèrent des heures chaque semaine.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="gap-2 bg-navy hover:bg-navy-dark text-white">
              Essayer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="gap-2 bg-transparent">
              Parler à un expert
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          Aucune carte bancaire requise • En ligne en 2 minutes • Support disponible en anglais et français
        </p>
      </div>
    </section>
  )
}
