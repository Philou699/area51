'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, Activity, Link, Zap } from 'lucide-react'
import { useAuthUser } from '@/hooks/use-auth-user'

export default function MyProfilePage() {
  const user = useAuthUser()

  if (!user) {
    return (
      <div className="page-background flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-border bg-card shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-6 mx-auto w-16 h-16 bg-gradient-to-br from-light-blue to-mint rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-navy dark:text-white mb-2">Non connecté</h2>
            <p className="text-muted-foreground mb-6">Veuillez vous connecter pour accéder à votre profil</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full bg-navy text-white hover:bg-navy-dark dark:bg-light-blue dark:text-navy dark:hover:bg-light-blue-muted"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-background flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header avec avatar */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-light-blue to-mint rounded-full flex items-center justify-center mb-4 shadow-lg">
              <User className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent mb-2">
              Mon Profil
            </h1>
            <p className="text-muted-foreground">Gérez votre compte et vos automatisations</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Informations personnelles - Prend 2 colonnes */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-border bg-card shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl text-navy dark:text-white">
                    <div className="p-2 bg-gradient-to-br from-light-blue to-mint rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-light-blue/10 dark:bg-light-blue/10 rounded-xl">
                    <div className="p-2 bg-light-blue/20 dark:bg-light-blue/30 rounded-lg">
                      <Mail className="h-5 w-5 text-light-blue" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-1">Adresse email</div>
                      <div className="font-semibold text-navy dark:text-white">{user.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-mint/10 dark:bg-mint/10 rounded-xl">
                    <div className="p-2 bg-mint/20 dark:bg-mint/30 rounded-lg">
                      <Calendar className="h-5 w-5 text-mint" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-1">Membre depuis</div>
                      <div className="font-semibold text-navy dark:text-white">
                        {new Date().toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions rapides */}
            <div className="space-y-6">
              <Card className="border-2 border-border bg-card shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-navy dark:text-white">
                    <div className="p-2 bg-gradient-to-br from-light-blue to-mint rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    Actions rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-12 hover:bg-light-blue/10 hover:text-light-blue transition-colors"
                    onClick={() => window.location.href = '/connections'}
                  >
                    <Link className="h-4 w-4 mr-3" />
                    Gérer mes connexions
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-12 hover:bg-mint/10 hover:text-mint transition-colors"
                    onClick={() => window.location.href = '/areas'}
                  >
                    <Activity className="h-4 w-4 mr-3" />
                    Mes automatisations
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Statistiques avec design moderne */}
          <Card className="mt-8 border-2 border-border bg-card shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-navy dark:text-white">
                <div className="p-2 bg-gradient-to-br from-light-blue to-mint rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                Aperçu de l&apos;activité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-light-blue/10 dark:bg-light-blue/10 rounded-xl">
                  <div className="text-3xl font-bold bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent mb-1">
                    0
                  </div>
                  <div className="text-sm text-muted-foreground">Connexions</div>
                </div>
                <div className="text-center p-4 bg-mint/10 dark:bg-mint/10 rounded-xl">
                  <div className="text-3xl font-bold bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent mb-1">
                    0
                  </div>
                  <div className="text-sm text-muted-foreground">Automatisations</div>
                </div>
                <div className="text-center p-4 bg-light-blue/10 dark:bg-light-blue/10 rounded-xl">
                  <div className="text-3xl font-bold bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent mb-1">
                    0
                  </div>
                  <div className="text-sm text-muted-foreground">Exécutions</div>
                </div>
                <div className="text-center p-4 bg-mint/10 dark:bg-mint/10 rounded-xl">
                  <div className="text-3xl font-bold bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent mb-1">
                    0
                  </div>
                  <div className="text-sm text-muted-foreground">Services</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
