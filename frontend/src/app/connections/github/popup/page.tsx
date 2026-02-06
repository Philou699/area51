"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"

function PopupContent() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState(
    "Préparation de la connexion GitHub..."
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get("token")
      if (!token) {
        setError("Jeton d'authentification manquant. Fermez cette fenêtre et reconnectez-vous.")
        setMessage(
          "La fenêtre peut être fermée et vous pouvez réessayer depuis la page principale."
        )
        return
      }

      try {
        setMessage("Initialisation de l'autorisation GitHub...")
        const response = await fetch("/api/connections/github/start", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Frontend-Origin": window.location.origin,
          },
          credentials: "include",
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || "Requête GitHub refusée.")
        }

        const { authorizeUrl } = (await response.json()) as {
          authorizeUrl: string
        }

        const mustForceLogin = searchParams.get("forceLogin") !== "0"
        const targetUrl = mustForceLogin
          ? `https://github.com/login?return_to=${encodeURIComponent(authorizeUrl)}`
          : authorizeUrl

        if (mustForceLogin) {
          setMessage("Redirection vers la page de connexion GitHub...")
        }

        window.location.replace(targetUrl)
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Impossible de démarrer l'autorisation GitHub."
        setError(msg)
        setMessage(
          "La fenêtre peut être fermée et vous pouvez réessayer depuis la page principale."
        )
      }
    }

    void run()
  }, [searchParams])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-white px-6 text-center">
      {!error ? (
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      ) : (
        <AlertCircle className="h-10 w-10 text-destructive" />
      )}
      <p className="text-lg font-medium">{message}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {error && (
        <button
          className="rounded-md border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          onClick={() => window.close()}
        >
          Fermer la fenêtre
        </button>
      )}
    </div>
  )
}

export default function GithubPopupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-white px-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">
            Préparation de la connexion GitHub...
          </p>
        </div>
      }
    >
      <PopupContent />
    </Suspense>
  )
}
