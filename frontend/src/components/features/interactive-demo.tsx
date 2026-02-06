"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Slack, Database, CheckCircle2, ArrowRight } from "lucide-react"

const workflows = [
  {
    id: "email",
    name: "Marketing Email",
    trigger: { icon: Mail, label: "Nouveau contact", color: "light-blue" },
    actions: [
      { icon: Database, label: "Ajouter au CRM", color: "mint" },
      { icon: Mail, label: "Envoyer email de bienvenue", color: "soft-yellow" },
      { icon: Slack, label: "Notifier l'équipe", color: "light-blue" },
    ],
  },
  {
    id: "support",
    name: "Support Client",
    trigger: { icon: Mail, label: "Ticket reçu", color: "mint" },
    actions: [
      { icon: Slack, label: "Alerter l'équipe support", color: "light-blue" },
      { icon: Database, label: "Créer ticket helpdesk", color: "soft-yellow" },
      { icon: Mail, label: "Envoyer confirmation client", color: "mint" },
    ],
  },
  {
    id: "sales",
    name: "Passation Ventes",
    trigger: { icon: Database, label: "Nouveau prospect", color: "soft-yellow" },
    actions: [
      { icon: Mail, label: "Envoyer email automatisé", color: "light-blue" },
      { icon: Database, label: "Scorer le prospect", color: "mint" },
      { icon: Slack, label: "Notifier le responsable", color: "soft-yellow" },
    ],
  },
]

export function InteractiveDemo() {
  const [activeWorkflow, setActiveWorkflow] = useState(workflows[0])

  return (
    <section className="bg-transparent px-4 py-24 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">Voyez la </span>
              <span className="bg-gradient-to-r from-mint to-soft-yellow bg-clip-text text-transparent">
                magie à l&apos;œuvre
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez comment créer de puissantes automatisations en quelques clics
            </p>
          </div>

          {/* Workflow selector */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {workflows.map((workflow) => (
              <Button
                key={workflow.id}
                variant={activeWorkflow.id === workflow.id ? "default" : "outline"}
                onClick={() => setActiveWorkflow(workflow)}
                className="transition-all"
              >
                {workflow.name}
              </Button>
            ))}
          </div>

          {/* Visual workflow */}
          <Card className="p-8 md:p-12 border-2">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Trigger */}
              <div className="flex flex-col items-center">
                <div
                  className={`p-6 rounded-2xl bg-${activeWorkflow.trigger.color}/10 border-2 border-${activeWorkflow.trigger.color}/30 mb-3`}
                >
                  <activeWorkflow.trigger.icon className={`w-8 h-8 text-${activeWorkflow.trigger.color}`} />
                </div>
                <span className="text-sm font-medium text-foreground">{activeWorkflow.trigger.label}</span>
                <span className="text-xs text-muted-foreground mt-1">Déclencheur</span>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0" />

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-6">
                {activeWorkflow.actions.map((action, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`p-5 rounded-xl bg-${action.color}/10 border-2 border-${action.color}/30 mb-3 relative`}
                    >
                      <action.icon className={`w-7 h-7 text-${action.color}`} />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-mint rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground text-center">{action.label}</span>
                    <span className="text-xs text-muted-foreground mt-1">Action {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Ce workflow s&apos;exécute automatiquement à chaque déclenchement
              </p>
              <Button variant="outline" className="gap-2 bg-transparent">
                Créer ce workflow
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
