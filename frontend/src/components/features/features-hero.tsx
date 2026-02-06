"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function FeaturesHero() {
  return (
    <section className="relative overflow-hidden bg-transparent px-4 py-24 md:py-32">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-light-blue/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-mint/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-soft-yellow/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="container mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-light-blue/10 border border-light-blue/20 mb-8">
            <Sparkles className="w-4 h-4 text-light-blue" />
            <span className="text-sm font-medium text-foreground">Découvrez la puissance de l&apos;automatisation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Fonctionnalités qui </span>
            <span className="bg-gradient-to-r from-light-blue via-mint to-soft-yellow bg-clip-text text-transparent">
              transforment vos flux de travail
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto">
            Automatisez intelligemment, connectez sans limites et libérez le potentiel de votre équipe avec une plateforme
            conçue pour l&apos;efficacité.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2 bg-navy hover:bg-navy-dark text-white">
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                Voir une démo
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { value: "500+", label: "Intégrations" },
            { value: "99.9%", label: "Disponibilité SLA" },
            { value: "<1s", label: "Temps d'exécution" },
            { value: "24/7", label: "Support mondial" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
