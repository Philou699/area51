"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { ArrowRight, Layers, Settings, Sparkles, X, Zap, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SelectDropdown } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getServices,
  createArea,
  updateArea,
  ApiError,
  getDiscordGuilds,
  getDiscordChannels,
} from "@/lib/api"
import type { Service, Action, Reaction, Area, UpdateAreaPayload } from "@/types/area"
import type { DiscordChannel, DiscordGuild } from "@/types/connections"
import { cn } from "@/lib/utils"

let discordGuildCache: DiscordGuild[] | null = null
const discordChannelCache = new Map<string, DiscordChannel[]>()

type TemplateSuggestion = {
  title: string
  template: string
  description?: string
}

interface CreateAreaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  mode?: "create" | "edit"
  area?: Area | null
}

export function CreateAreaModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  area = null,
}: CreateAreaModalProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const makeEmptyFormState = () => ({
    actionServiceId: null as number | null,
    actionId: null as number | null,
    reactionServiceId: null as number | null,
    reactionId: null as number | null,
    actionConfig: {} as Record<string, unknown>,
    reactionConfig: {} as Record<string, unknown>,
  })
  const [formData, setFormData] = useState(makeEmptyFormState)
  const isEditing = mode === "edit" && Boolean(area)

  // Load services on mount
  useEffect(() => {
    if (isOpen) {
      loadServices()
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (isEditing && area && services.length > 0) {
      setFormData({
        actionServiceId: area.action.service.id,
        actionId: area.action.id,
        reactionServiceId: area.reaction.service.id,
        reactionId: area.reaction.id,
        actionConfig: area.actionConfig ?? {},
        reactionConfig: area.reactionConfig ?? {},
      })
    } else if (mode === "create") {
      setFormData(makeEmptyFormState())
    }
  }, [isOpen, isEditing, area, services, mode])

  const loadServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getServices()
      setServices(response.services)
    } catch (err) {
      console.error("Erreur lors du chargement des services:", err)
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Impossible de charger les services. Veuillez réessayer.")
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedActionService = services.find((s) => s.id === formData.actionServiceId)
  const selectedAction = selectedActionService?.actions.find((a) => a.id === formData.actionId)
  const selectedReactionService = services.find((s) => s.id === formData.reactionServiceId)
  const selectedReaction = selectedReactionService?.reactions.find((r) => r.id === formData.reactionId)
  const actionServiceSlug = selectedActionService?.slug
  const reactionServiceSlug = selectedReactionService?.slug
  const servicesRequiringConnection = services.filter(
    (service) => service.requiresConnection && !service.connected,
  )
  const missingConnectionNames = servicesRequiringConnection.map((service) => service.name).join(", ")
  const needsPlural = servicesRequiringConnection.length > 1

  const currentStep = useMemo(() => {
    if (!formData.actionId) return 1
    if (!formData.reactionId) return 2
    return 3
  }, [formData.actionId, formData.reactionId])

  const steps = useMemo<StepItem[]>(
    () => [
      {
        title: "Déclencheur",
        caption: "Choisissez le service qui déclenche l’automatisation",
        status: currentStep === 1 ? "current" : currentStep > 1 ? "complete" : "upcoming",
      },
      {
        title: "Action",
        caption: "Définissez la réaction qui suivra automatiquement",
        status: currentStep === 2 ? "current" : currentStep > 2 ? "complete" : "upcoming",
      },
      {
        title: "Aperçu",
        caption: "Personnalisez et confirmez votre Area",
        status: currentStep === 3 ? "current" : "upcoming",
      },
    ],
    [currentStep],
  )

  const makeServiceOption = (service: Service) => ({
    value: service.id.toString(),
    label: service.name,
    disabled: Boolean(service.requiresConnection && !service.connected),
    description:
      service.requiresConnection && !service.connected
        ? "Connectez ce service depuis l’onglet Connexions."
        : undefined,
  })
  const readyToSubmit = Boolean(formData.actionId && formData.reactionId && !submitting)

  const handleSubmit = async () => {
    if (!formData.actionId || !formData.reactionId) {
      setError("Veuillez sélectionner un déclencheur et une action")
      return
    }

    if (!selectedAction || !selectedReaction || !selectedActionService || !selectedReactionService) {
      setError("Sélection invalide")
      return
    }

    if (selectedActionService.requiresConnection && !selectedActionService.connected) {
      setError(`Connectez le service ${selectedActionService.name} avant de l'utiliser.`)
      return
    }

    if (selectedReactionService.requiresConnection && !selectedReactionService.connected) {
      setError(`Connectez le service ${selectedReactionService.name} avant de l'utiliser.`)
      return
    }

    const submissionName =
      isEditing && area
        ? generatedName || area.name
        : generatedName

    if (!submissionName) {
      setError("Impossible de déterminer le nom de l'area")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      if (isEditing && area) {
        const payload: UpdateAreaPayload = {
          name: submissionName,
          actionId: formData.actionId,
          reactionId: formData.reactionId,
          actionConfig: formData.actionConfig,
          reactionConfig: formData.reactionConfig,
        }

        if (area.dedupKeyStrategy !== null && area.dedupKeyStrategy !== undefined) {
          payload.dedupKeyStrategy = area.dedupKeyStrategy
        }

        await updateArea(area.id, payload)
      } else {
        await createArea({
          name: submissionName,
          actionId: formData.actionId,
          reactionId: formData.reactionId,
          actionConfig: formData.actionConfig,
          reactionConfig: formData.reactionConfig,
        })
      }

      // Reset form
      setFormData(makeEmptyFormState())

      onSubmit()
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de l'area:", err)
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(isEditing ? "Impossible de mettre à jour l'area. Veuillez réessayer." : "Impossible de créer l'area. Veuillez réessayer.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(makeEmptyFormState())
    setError(null)
    onClose()
  }

  // Generate options for dropdowns
  const serviceOptions = services.map(makeServiceOption)

  const actionOptions = selectedActionService?.actions.map(action => ({
    value: action.id.toString(),
    label: action.description || action.key
  })) || []

  const reactionServiceOptions = services.map(makeServiceOption)

  const reactionOptions = selectedReactionService?.reactions.map(reaction => ({
    value: reaction.id.toString(),
    label: reaction.description || reaction.key
  })) || []

  // Generate area name
  const generatedName = useMemo(() => {
    if (!selectedActionService || !selectedReactionService) return ""
    return `${selectedActionService.name} → ${selectedReactionService.name}`
  }, [selectedActionService, selectedReactionService])

  const resolvedName = useMemo(() => {
    if (isEditing && area) {
      return generatedName || area.name
    }
    return generatedName
  }, [isEditing, area, generatedName])

  const generatedDescription = useMemo(() => {
    if (!selectedAction || !selectedReaction || !selectedActionService || !selectedReactionService) {
      return ""
    }
    return `Quand "${selectedAction.description}" sur ${selectedActionService.name}, alors "${selectedReaction.description}" sur ${selectedReactionService.name}`
  }, [selectedAction, selectedReaction, selectedActionService, selectedReactionService])

  const discordMessageSuggestions = useMemo<TemplateSuggestion[]>(() => {
    if (
      !selectedAction ||
      actionServiceSlug !== "github" ||
      reactionServiceSlug !== "discord" ||
      selectedReaction?.key !== "send_channel_message"
    ) {
      return []
    }

    const base: TemplateSuggestion[] = [
      {
        title: "Résumé express",
        description: "Annonce courte avec lien direct vers GitHub.",
        template:
          "Nouvelle activité GitHub sur {{activity.owner}}/{{activity.repo}} : **{{activity.title}}**\n{{activity.url}}",
      },
    ]

    switch (selectedAction.key) {
      case "new_issue":
        base.unshift({
          title: "Annonce d’issue",
          description: "Rappelle le numéro, l’auteur et la description.",
          template:
            "🆕 Nouvelle issue #{{activity.number}} ouverte sur {{activity.owner}}/{{activity.repo}}\nAuteur : {{activity.author}}\nTitre : {{activity.title}}\nDescription : {{activity.body}}\n{{activity.url}}",
        })
        break
      case "new_pull_request":
        base.unshift({
          title: "Nouvelle pull request",
          description: "Mentionne l’auteur et invite à la review.",
          template:
            "🔁 Pull request #{{activity.number}} par {{activity.author}} sur {{activity.owner}}/{{activity.repo}}\nTitre : {{activity.title}}\nAperçu : {{activity.body}}\nLien : {{activity.url}}\nMerci de lancer une review ✅",
        })
        break
      case "new_release":
        base.unshift({
          title: "Annonce de release",
          description: "Résumé pour un salon #annonces.",
          template:
            "🚀 Nouvelle release sur {{activity.owner}}/{{activity.repo}}\nNom : {{activity.title}}\nNotes : {{activity.body}}\nTéléchargez-la ici 👉 {{activity.url}}",
        })
        break
      default:
        break
    }

    return base
  }, [selectedAction, actionServiceSlug, reactionServiceSlug, selectedReaction?.key])

  const handleApplyDiscordSuggestion = useCallback(
    (template: string) => {
      setFormData((prev) => ({
        ...prev,
        reactionConfig: {
          ...prev.reactionConfig,
          contentTemplate: template,
        },
      }))
    },
    [setFormData],
  )

  const primaryActionLabel = isEditing ? "Mettre à jour l'Area" : "Créer l'Area"
  const primaryActionLoading = isEditing ? "Mise à jour en cours…" : "Création en cours…"

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-gradient-to-br from-background/92 via-background/80 to-background/92 backdrop-blur-xl"
        onClick={handleClose}
      />

      <div className="relative z-10 flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-background/95 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute -top-32 right-[-10rem] h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-[-12rem] h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />

        <button
          onClick={handleClose}
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground shadow-sm transition hover:bg-background"
          aria-label="Fermer la fenêtre de création"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative grid flex-1 overflow-hidden md:grid-cols-[1.65fr_1fr]">
          <div className="space-y-8 overflow-y-auto p-6 pb-8 md:p-10">
            <header className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {isEditing ? "Modifier une Area" : "Composer une nouvelle Area"}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                    {isEditing
                      ? "Ajustez votre automatisation en mettant à jour le déclencheur, la réaction ou leurs paramètres."
                      : "Assemblez un déclencheur et une réaction pour automatiser vos flux entre services. Nous vous guidons étape par étape."}
                  </p>
                </div>
              </div>
            </header>

            <StepRail steps={steps} />

            {error && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-sm text-destructive shadow-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/80 px-6 py-16 text-center shadow-inner">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
                <p className="text-sm text-muted-foreground">Chargement des services et des actions disponibles…</p>
              </div>
            ) : (
              <>
                {servicesRequiringConnection.length > 0 && (
                  <div className="flex flex-col gap-4 rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4 text-sm text-primary sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">Connexion requise</p>
                      <p className="mt-1 text-sm text-primary/90">
                        {missingConnectionNames} {needsPlural ? "nécessitent" : "nécessite"} une autorisation active. Ouvrez la page Connexions pour lier {needsPlural ? "ces services" : "ce service"} avant de poursuivre.
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/10">
                      <Link href="/connections" target="_blank" rel="noreferrer">
                        Ouvrir mes connexions
                      </Link>
                    </Button>
                  </div>
                )}

                <SectionShell
                  icon={Layers}
                  tone="primary"
                  title="Déclencheur"
                  subtitle="Choisissez le service et l’évènement qui démarrera l’automatisation."
                  active={currentStep >= 1}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <LabeledField label="Service" required>
                      <SelectDropdown
                        options={serviceOptions}
                        value={formData.actionServiceId?.toString() || ""}
                        onValueChange={(value: string) =>
                          setFormData({
                            ...formData,
                            actionServiceId: parseInt(value, 10),
                            actionId: null,
                            actionConfig: {},
                          })
                        }
                        placeholder="Sélectionnez un service"
                      />
                    </LabeledField>
                    <LabeledField label="Évènement" required hint={!formData.actionServiceId ? "Choisissez d’abord un service" : undefined}>
                      <SelectDropdown
                        options={actionOptions}
                        value={formData.actionId?.toString() || ""}
                        onValueChange={(value: string) =>
                          setFormData({
                            ...formData,
                            actionId: parseInt(value, 10),
                            actionConfig: {},
                          })
                        }
                        placeholder="Quel évènement surveiller ?"
                        disabled={!formData.actionServiceId}
                      />
                    </LabeledField>
                  </div>

                  {selectedAction?.configSchema && (
                    <fieldset className="mt-6 space-y-4 rounded-xl border border-primary/10 bg-primary/5 px-4 py-4">
                      <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                        Paramètres du déclencheur
                      </legend>
                      <ConfigFields
                        actionOrReaction={selectedAction}
                        config={formData.actionConfig}
                        onChange={(config) => setFormData({ ...formData, actionConfig: config })}
                      />
                    </fieldset>
                  )}
                </SectionShell>

                <SectionShell
                  icon={Zap}
                  tone="secondary"
                  title="Action"
                  subtitle="Déterminez la réaction exécutée automatiquement."
                  active={currentStep >= 2}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <LabeledField label="Service" required>
                      <SelectDropdown
                        options={reactionServiceOptions}
                        value={formData.reactionServiceId?.toString() || ""}
                        onValueChange={(value: string) =>
                          setFormData({
                            ...formData,
                            reactionServiceId: parseInt(value, 10),
                            reactionId: null,
                            reactionConfig: {},
                          })
                        }
                        placeholder="Sélectionnez un service"
                      />
                    </LabeledField>
                    <LabeledField label="Réaction" required hint={!formData.reactionServiceId ? "Choisissez d’abord un service" : undefined}>
                      <SelectDropdown
                        options={reactionOptions}
                        value={formData.reactionId?.toString() || ""}
                        onValueChange={(value: string) =>
                          setFormData({
                            ...formData,
                            reactionId: parseInt(value, 10),
                            reactionConfig: {},
                          })
                        }
                        placeholder="Sélectionnez une action"
                        disabled={!formData.reactionServiceId}
                      />
                    </LabeledField>
                  </div>

                  {selectedReaction?.configSchema && (
                    <fieldset className="mt-6 space-y-4 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-4">
                      <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground/70">
                        Paramètres de la réaction
                      </legend>
                      <ConfigFields
                        actionOrReaction={selectedReaction}
                        config={formData.reactionConfig}
                        onChange={(config) => setFormData({ ...formData, reactionConfig: config })}
                      />
                      {discordMessageSuggestions.length > 0 && (
                        <TemplateSuggestionList
                          suggestions={discordMessageSuggestions}
                          onApply={handleApplyDiscordSuggestion}
                          currentValue={
                            typeof formData.reactionConfig?.contentTemplate === "string"
                              ? (formData.reactionConfig.contentTemplate as string)
                              : ""
                          }
                        />
                      )}
                    </fieldset>
                  )}
                </SectionShell>

                <footer className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto" disabled={submitting}>
                    Annuler
                  </Button>
                  <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={!readyToSubmit}>
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                        {primaryActionLoading}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {primaryActionLabel}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </footer>
              </>
            )}
          </div>

          <aside className="hidden h-full flex-col justify-between overflow-y-auto border-l border-border/60 bg-muted/30/60 p-6 md:flex">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/50 bg-background/70 p-5 shadow-inner">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Settings className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Aperçu en direct</h3>
                    <p className="text-xs text-muted-foreground">Votre automatisation se construit au fil des choix.</p>
                  </div>
                </div>

                <dl className="mt-5 space-y-4 text-sm">
                  <div className="rounded-xl border border-border/40 bg-background/60 px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Déclencheur</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {selectedActionService ? selectedActionService.name : "Non défini"}
                    </dd>
                    {selectedAction && <p className="mt-1 text-xs text-muted-foreground">{selectedAction.description}</p>}
                  </div>
                  <div className="rounded-xl border border-border/40 bg-background/60 px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Action</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {selectedReactionService ? selectedReactionService.name : "Non définie"}
                    </dd>
                    {selectedReaction && <p className="mt-1 text-xs text-muted-foreground">{selectedReaction.description}</p>}
                  </div>
                </dl>
              </div>

              {resolvedName ? (
                <Card className="border-border/40 bg-background/70">
                  <CardContent className="space-y-3 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Résumé</p>
                    <h4 className="text-base font-semibold text-foreground">{resolvedName}</h4>
                    {generatedDescription && <p className="text-sm leading-6 text-muted-foreground">{generatedDescription}</p>}
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-6 text-sm text-muted-foreground">
                  Sélectionnez un déclencheur et une action pour voir apparaître un résumé détaillé.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/70 px-5 py-4 text-xs text-muted-foreground">
              Astuce : vous pourrez ajuster les paramètres plus tard dans la page « Areas ». Commencez petit, testez, puis affinez vos automatisations.
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

type StepStatus = "complete" | "current" | "upcoming"

type StepItem = {
  title: string
  caption: string
  status: StepStatus
}

function StepRail({ steps }: { steps: StepItem[] }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/70 p-5 shadow-inner">
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition",
                step.status === "complete" && "border-emerald-500 bg-emerald-500/15 text-emerald-600",
                step.status === "current" && "border-primary bg-primary/10 text-primary",
                step.status === "upcoming" && "border-border text-muted-foreground",
              )}
            >
              {index + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.caption}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function SectionShell({
  icon: Icon,
  tone,
  title,
  subtitle,
  children,
  active,
}: {
  icon: LucideIcon
  tone: "primary" | "secondary"
  title: string
  subtitle: string
  children: ReactNode
  active: boolean
}) {
  const toneClasses = tone === "primary" ? "bg-primary/5 border-primary/10" : "bg-secondary/5 border-secondary/15"

  return (
    <section
      className={cn(
        "rounded-2xl border px-5 py-6 shadow-sm transition",
        toneClasses,
        active ? "opacity-100" : "opacity-60",
      )}
    >
      <header className="mb-5 flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            tone === "primary" ? "bg-primary/15 text-primary" : "bg-secondary/20 text-secondary-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function LabeledField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-foreground">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>{label}</span>
        {required && <span className="text-destructive">Obligatoire</span>}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </label>
  )
}

interface DiscordSelectFieldProps {
  label: string
  required: boolean
  value: string
  onChange: (value: string) => void
}

function DiscordGuildField({ label, required, value, onChange }: DiscordSelectFieldProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState(
    () =>
      (discordGuildCache ?? []).map((guild) => ({
        value: guild.id,
        label: guild.name,
        description: guild.owner ? "Vous êtes propriétaire" : undefined,
      }))
  )

  useEffect(() => {
    let active = true

    const fetchGuilds = async () => {
      if (discordGuildCache) {
        setOptions(
          discordGuildCache.map((guild) => ({
            value: guild.id,
            label: guild.name,
            description: guild.owner ? "Vous êtes propriétaire" : undefined,
          }))
        )
        return
      }

      try {
        setLoading(true)
        const response = await getDiscordGuilds()
        if (!active) return
        discordGuildCache = response.guilds
        setOptions(
          response.guilds.map((guild) => ({
            value: guild.id,
            label: guild.name,
            description: guild.owner ? "Vous êtes propriétaire" : undefined,
          }))
        )
        setError(null)
      } catch (err) {
        console.error("Discord guild fetch failed:", err)
        if (!active) return
        const message =
          err instanceof Error
            ? err.message
            : "Impossible de charger vos serveurs Discord. Assurez-vous d'être connecté."
        setError(message)
        setOptions([])
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void fetchGuilds()

    return () => {
      active = false
    }
  }, [])

  return (
    <LabeledField label={label} required={required}>
      <SelectDropdown
        options={options}
        value={value}
        onValueChange={(val) => onChange(val)}
        placeholder={loading ? "Chargement des serveurs…" : "Sélectionnez un serveur"}
        disabled={loading}
      />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {!error && !loading && options.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Aucun serveur autorisé. Invitez d&apos;abord le bot via la page Connexions.
        </p>
      )}
    </LabeledField>
  )
}

interface DiscordChannelFieldProps extends DiscordSelectFieldProps {
  guildId?: string
}

function DiscordChannelField({ label, required, value, guildId, onChange }: DiscordChannelFieldProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState(() => {
    if (guildId && discordChannelCache.has(guildId)) {
      return (discordChannelCache.get(guildId) ?? []).map((channel) => ({
        value: channel.id,
        label: channel.name,
        description: channel.categoryName || undefined,
      }))
    }
    return []
  })

  useEffect(() => {
    let active = true

    const fetchChannels = async () => {
      if (!guildId) {
        setOptions([])
        setError(null)
        setLoading(false)
        return
      }

      const cached = discordChannelCache.get(guildId)
      if (cached) {
        setOptions(
          cached.map((channel) => ({
            value: channel.id,
            label: channel.name,
            description: channel.categoryName || undefined,
          }))
        )
        setError(null)
        return
      }

      try {
        setLoading(true)
        const response = await getDiscordChannels(guildId)
        if (!active) return
        discordChannelCache.set(guildId, response.channels)
        setOptions(
          response.channels.map((channel) => ({
            value: channel.id,
            label: channel.name,
            description: channel.categoryName || undefined,
          }))
        )
        setError(null)
      } catch (err) {
        console.error("Discord channel fetch failed:", err)
        if (!active) return
        const message =
          err instanceof Error
            ? err.message
            : "Impossible de récupérer les salons pour ce serveur."
        setError(message)
        setOptions([])
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void fetchChannels()

    return () => {
      active = false
    }
  }, [guildId])

  return (
    <LabeledField label={label} required={required}>
      <SelectDropdown
        options={options}
        value={guildId ? value : ""}
        onValueChange={(val) => onChange(val)}
        placeholder={
          !guildId
            ? "Choisissez d’abord un serveur"
            : loading
            ? "Chargement des salons…"
            : options.length > 0
            ? "Sélectionnez un salon"
            : "Aucun salon disponible"
        }
        disabled={!guildId || loading}
      />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {!guildId && (
        <p className="mt-2 text-xs text-muted-foreground">
          Sélectionnez d&apos;abord un serveur pour charger ses salons textuels.
        </p>
      )}
    </LabeledField>
  )
}

function ConfigFields({
  actionOrReaction,
  config,
  onChange,
}: {
  actionOrReaction: Action | Reaction
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}) {
  const schema = actionOrReaction.configSchema
  if (!schema || !schema.properties) return null

  return (
    <div className="grid gap-4">
      {Object.entries(schema.properties).map(([key, prop]) => {
        const isRequired = schema.required?.includes(key) ?? false
        const rawValue = config[key] ?? prop.default ?? ""
        const value = rawValue === null || rawValue === undefined ? "" : String(rawValue)

        if (prop.type === "string") {
          if (prop.format === "discord-guild") {
            return (
              <DiscordGuildField
                key={key}
                label={prop.description || key}
                required={isRequired}
                value={value}
                onChange={(guildId) => {
                  const nextConfig = { ...config, [key]: guildId }
                  if (Object.prototype.hasOwnProperty.call(nextConfig, "channelId")) {
                    delete (nextConfig as Record<string, unknown>).channelId
                  }
                  if (Object.prototype.hasOwnProperty.call(nextConfig, "channel_id")) {
                    delete (nextConfig as Record<string, unknown>).channel_id
                  }
                  onChange(nextConfig)
                }}
              />
            )
          }

          if (prop.format === "discord-channel") {
            const guildIdCandidate =
              typeof config.guildId === "string"
                ? config.guildId
                : typeof (config as Record<string, unknown>)["guild_id"] === "string"
                ? String((config as Record<string, unknown>)["guild_id"])
                : undefined

            return (
              <DiscordChannelField
                key={key}
                label={prop.description || key}
                required={isRequired}
                value={value}
                guildId={guildIdCandidate}
                onChange={(channelId) => onChange({ ...config, [key]: channelId })}
              />
            )
          }

          if (prop.enum) {
            return (
              <LabeledField key={key} label={prop.description || key} required={isRequired}>
                <SelectDropdown
                  options={prop.enum.map((entry: string) => ({ value: entry, label: entry }))}
                  value={String(value)}
                  onValueChange={(val: string) => onChange({ ...config, [key]: val })}
                  placeholder={`Sélectionner ${prop.description || key}`}
                />
              </LabeledField>
            )
          }

          return (
            <LabeledField key={key} label={prop.description || key} required={isRequired}>
              <Input
                id={key}
                type={prop.format === "uri" ? "url" : "text"}
                value={String(value)}
                placeholder={prop.description || key}
                onChange={(event) => onChange({ ...config, [key]: event.target.value })}
                required={isRequired}
              />
            </LabeledField>
          )
        }

        if (prop.type === "number") {
          return (
            <LabeledField key={key} label={prop.description || key} required={isRequired}>
              <Input
                id={key}
                type="number"
                value={value === "" ? "" : Number(value)}
                placeholder={prop.description || key}
                onChange={(event) => onChange({ ...config, [key]: parseFloat(event.target.value) })}
                min={prop.minimum}
                max={prop.maximum}
                required={isRequired}
              />
            </LabeledField>
          )
        }

        if (prop.type === "boolean") {
          return (
            <div key={key} className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 px-4 py-3">
              <Checkbox
                id={key}
                checked={Boolean(value)}
                onCheckedChange={(checked: boolean) => onChange({ ...config, [key]: Boolean(checked) })}
              />
              <Label htmlFor={key} className="text-sm font-medium text-foreground">
                {prop.description || key}
              </Label>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

function TemplateSuggestionList({
  suggestions,
  onApply,
  currentValue,
}: {
  suggestions: TemplateSuggestion[]
  onApply: (template: string) => void
  currentValue: string
}) {
  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-background/80 p-4 shadow-inner">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
            Suggestions GitHub → Discord
          </p>
          <p className="text-xs text-muted-foreground">Cliquez pour remplir automatiquement le message Discord.</p>
        </div>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const isActive = currentValue === suggestion.template
          return (
            <button
              key={suggestion.title}
              type="button"
              onClick={() => onApply(suggestion.template)}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/40",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/70 bg-background/80 hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{suggestion.title}</p>
                  {suggestion.description && (
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                  )}
                </div>
                {isActive && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                    Utilisé
                  </span>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-xs font-mono text-muted-foreground">
                {suggestion.template}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
