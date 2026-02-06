"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { completeDiscordConnection } from "@/lib/api"

type CallbackState = "loading" | "success" | "error"

function DiscordCallbackContent() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<CallbackState>("loading")
  const [message, setMessage] = useState<string>("Connexion à Discord en cours…")

  useEffect(() => {
    const code = searchParams.get("code")
    const returnedState = searchParams.get("state")
    const guildId = searchParams.get("guild_id") ?? undefined

    const run = async () => {
      if (!code || !returnedState) {
        setState("error")
        setMessage("Paramètres manquants dans l'URL de retour Discord.")
        return
      }

      const storedState = window.localStorage.getItem("discord_oauth_state")
      if (!storedState || storedState !== returnedState) {
        setState("error")
        setMessage("Le paramètre de vérification de l'état OAuth est invalide ou expiré.")
        return
      }

      try {
        await completeDiscordConnection({ code, state: returnedState, guildId })
        window.localStorage.removeItem("discord_oauth_state")

        setState("success")
        setMessage("Votre compte Discord est désormais connecté à AREA51.")

        if (window.opener) {
          window.opener.postMessage(
            { type: "discord-connection:completed", success: true },
            window.location.origin
          )
        }

        setTimeout(() => {
          window.close()
        }, 1200)
      } catch (error) {
        console.error("Échec de la connexion Discord :", error)
        setState("error")
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la connexion à Discord."
        setMessage(errorMessage)

        if (window.opener) {
          window.opener.postMessage(
            { type: "discord-connection:completed", success: false, error: errorMessage },
            window.location.origin
          )
        }
      }
    }

    void run()
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 px-6">
      <div className="w-full max-w-md rounded-3xl border border-border/40 bg-background/95 p-10 text-center shadow-2xl backdrop-blur">
        <div className="mb-6 flex justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              state === "success"
                ? "bg-emerald-500/10 text-emerald-500"
                : state === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            }`}
          >
            {state === "loading" && (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {state === "success" && <span className="text-3xl">✅</span>}
            {state === "error" && <span className="text-3xl">⚠️</span>}
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
          {state === "success"
            ? "Connexion réussie"
            : state === "error"
            ? "Échec de la connexion"
            : "Connexion en cours"}
        </h1>
        <p className="mb-6 text-base text-foreground/70">{message}</p>

        {state !== "loading" && (
          <button
            type="button"
            onClick={() => window.close()}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
          >
            Fermer la fenêtre
          </button>
        )}
      </div>
    </div>
  )
}

export default function DiscordCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 px-6">
          <div className="w-full max-w-md rounded-3xl border border-border/40 bg-background/95 p-10 text-center shadow-2xl backdrop-blur">
            <div className="mb-4 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
            <p className="text-sm text-foreground/70">Initialisation de la connexion à Discord…</p>
          </div>
        </div>
      }
    >
      <DiscordCallbackContent />
    </Suspense>
  )
}
