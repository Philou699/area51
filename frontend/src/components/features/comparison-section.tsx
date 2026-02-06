"use client"

import { Check, X } from "lucide-react"
import { Card } from "@/components/ui/card"

const features = [
  { name: "Interface intuitive", area: true, zapier: false, ifttt: false },
  { name: "Plan gratuit généreux", area: true, zapier: false, ifttt: false },
  { name: "Logique conditionnelle avancée", area: true, zapier: true, ifttt: false },
  { name: "Support en français", area: true, zapier: false, ifttt: false },
  { name: "Webhooks illimités", area: true, zapier: false, ifttt: false },
  { name: "Hébergement UE", area: true, zapier: false, ifttt: false },
  { name: "Accès API complet", area: true, zapier: true, ifttt: false },
  { name: "Collaboration d'équipe", area: true, zapier: true, ifttt: false },
]

export function ComparisonSection() {
  return (
    <section className="bg-transparent px-4 py-24 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">Pourquoi choisir </span>
              <span className="bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent">
                notre plateforme ?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une comparaison franche avec les leaders du marché
            </p>
          </div>

          <Card className="overflow-hidden border-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-6 font-bold text-foreground">Fonctionnalité</th>
                    <th className="p-6 text-center">
                      <div className="inline-flex px-4 py-2 rounded-full bg-gradient-to-r from-light-blue to-mint text-white font-bold">
                        AREA
                      </div>
                    </th>
                    <th className="p-6 text-center font-medium text-muted-foreground">Zapier</th>
                    <th className="p-6 text-center font-medium text-muted-foreground">IFTTT</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-6 font-medium text-foreground">{feature.name}</td>
                      <td className="p-6 text-center">
                        {feature.area ? (
                          <div className="inline-flex p-2 rounded-full bg-mint/20">
                            <Check className="w-5 h-5 text-mint" />
                          </div>
                        ) : (
                          <div className="inline-flex p-2 rounded-full bg-muted">
                            <X className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {feature.zapier ? (
                          <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {feature.ifttt ? (
                          <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
