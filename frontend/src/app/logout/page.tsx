"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { logout } from "@/lib/auth-client"
import { clearAuthSession } from "@/lib/auth-storage"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const performLogout = async () => {
      try {
        await logout()
      } catch (error) {
        console.warn("Erreur lors de la déconnexion:", error)
      } finally {
        clearAuthSession()
        if (isMounted) {
          router.replace("/")
        }
      }
    }

    void performLogout()

    return () => {
      isMounted = false
    }
  }, [router])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Déconnexion en cours…</p>
    </div>
  )
}
