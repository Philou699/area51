"use client"

import { Suspense, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function ResultContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status") === "success" ? "success" : "error"
  const reason = searchParams.get("reason") ?? undefined

  const message = useMemo(() => {
    if (status === "success") {
      return "Compte GitHub connecté avec succès !"
    }

    if (reason === "already_linked") {
      return "Ce compte GitHub est déjà associé à un autre utilisateur."
    }

    return "La connexion GitHub a échoué. Veuillez réessayer."
  }, [status, reason])

  useEffect(() => {
    const payload = {
      provider: "github",
      status,
      reason,
    }

    const origin = window.location.origin

    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(payload, origin)
      } catch (err) {
        console.error("postMessage error", err)
      }

      setTimeout(() => window.close(), 300)
    } else {
      if (status === "success") {
        window.location.replace(`/connections?connected=github`)
      } else {
        window.location.replace(`/connections?error=github:${reason ?? "unknown"}`)
      }
    }
  }, [status, reason])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-white px-6 text-center">
      {status === "success" ? (
        <CheckCircle className="h-12 w-12 text-emerald-400" />
      ) : (
        <AlertTriangle className="h-12 w-12 text-destructive" />
      )}
      <p className="text-xl font-semibold">{message}</p>
      <p className="text-sm text-white/70">
        Cette fenêtre va se fermer automatiquement. Si elle reste ouverte, vous pouvez utiliser les boutons ci-dessous.
      </p>
      <div className="flex gap-3">
        <Button asChild variant="secondary">
          <Link href="/connections">Retour aux connexions</Link>
        </Button>
        <Button variant="outline" onClick={() => window.close()}>
          Fermer la fenêtre
        </Button>
      </div>
    </div>
  )
}

export default function GithubResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-white px-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p>Chargement…</p>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  )
}
