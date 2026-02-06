"use client"

import { useEffect, useState } from "react"

import { AUTH_STATE_EVENT, getStoredAuthUser, type StoredAuthUser } from "@/lib/auth-storage"

export function useAuthUser() {
  const [user, setUser] = useState<StoredAuthUser | null>(() =>
    typeof window === "undefined" ? null : getStoredAuthUser(),
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const updateUser = () => {
      setUser(getStoredAuthUser())
    }

    updateUser()

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("auth_")) {
        updateUser()
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(AUTH_STATE_EVENT, updateUser)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(AUTH_STATE_EVENT, updateUser)
    }
  }, [])

  return user
}
