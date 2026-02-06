"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Github, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthToken } from "@/lib/api"

type FlowStatus = "initializing" | "waiting" | "success" | "error"

export default function GithubAuthorizePage() {
  const router = useRouter()
  const popupRef = useRef<Window | null>(null)
  const [status, setStatus] = useState<FlowStatus>("initializing")
  const [message, setMessage] = useState(
    "Préparation de la connexion GitHub..."
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorReason, setErrorReason] = useState<string | null>(null)

  const closePopup = () => {
    popupRef.current?.close()
    popupRef.current = null
  }

  const launchFlow = useCallback(
    (options: { forceLogin?: boolean } = {}) => {
      setStatus("waiting")
      setErrorMessage(null)
      setErrorReason(null)
      setMessage(
        "Choisissez votre compte et autorisez AREA dans la fenêtre GitHub. Cette page se mettra à jour automatiquement."
      )
      closePopup()

      const token = getAuthToken()
      if (!token) {
        setStatus("error")
        setErrorMessage(
          "Vous devez être connecté pour lier GitHub. Veuillez revenir en arrière et réessayer."
        )
        return
      }

      const shouldForceLogin = options.forceLogin ?? true

      const popup = window.open(
        `/connections/github/popup?token=${encodeURIComponent(token)}${shouldForceLogin ? "&forceLogin=1" : ""}`,
        "github-oauth",
        "width=600,height=720"
      )

      if (!popup) {
        setStatus("error")
        setErrorMessage(
          "Impossible d'ouvrir la fenêtre GitHub. Veuillez autoriser les pop-ups puis réessayer."
        )
        return
      }

      popupRef.current = popup
    },
    []
  )

  useEffect(() => {
    launchFlow()

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return
      }

      if (event.data?.provider !== "github") {
        return
      }

      closePopup()

      if (event.data.status === "success") {
        setStatus("success")
        setErrorReason(null)
        setMessage("Compte GitHub connecté ! Redirection en cours...")
        setTimeout(() => {
          router.replace("/connections?connected=github")
        }, 1200)
      } else {
        setStatus("error")
        const reasonKey =
          typeof event.data.reason === "string" ? event.data.reason : null
        setErrorReason(reasonKey)
        if (reasonKey === "already_linked") {
          setMessage(
            "Ce compte GitHub est déjà associé à un autre utilisateur. Connectez-vous avec un autre compte."
          )
          setErrorMessage(
            "Ce compte GitHub est déjà associé à un autre utilisateur."
          )
        } else {
          setMessage("La connexion GitHub a échoué. Veuillez réessayer.")
          setErrorMessage(
            "Une erreur inattendue est survenue pendant la connexion à GitHub."
          )
        }
      }
    }

    window.addEventListener("message", handler)
    return () => {
      window.removeEventListener("message", handler)
      closePopup()
    }
  }, [launchFlow, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-foreground flex items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full bg-card/80 backdrop-blur border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background">
            <Github className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Connexion GitHub</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="flex flex-col items-center gap-4">
            {status === "waiting" && (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            )}
            {status === "initializing" && (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            )}
            {status === "success" && (
              <div className="text-emerald-400 text-lg font-medium">
                {message}
              </div>
            )}
            {status !== "success" && (
              <p className="text-foreground/80 whitespace-pre-line">{message}</p>
            )}
            {errorMessage && (
              <p className="text-destructive text-sm">{errorMessage}</p>
            )}
            {status === "error" && errorReason === "already_linked" && (
              <p className="text-xs text-foreground/60">
                Utilisez &quot;Changer de compte GitHub&quot; pour ouvrir GitHub, vous déconnecter puis sélectionner l&apos;autre compte.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {status === "error" && (
              <Button
                onClick={() =>
                  launchFlow(
                    errorReason === "already_linked" ? { forceLogin: true } : {}
                  )
                }
                className="sm:flex-1"
              >
                Réessayer
              </Button>
            )}
            {status === "error" && errorReason === "already_linked" && (
              <Button
                variant="secondary"
                onClick={() => launchFlow({ forceLogin: true })}
                className="sm:flex-1"
              >
                Changer de compte GitHub
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                closePopup()
                router.push("/connections")
              }}
              className="sm:flex-1"
            >
              Retour aux connexions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
