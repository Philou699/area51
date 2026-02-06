import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bon retour"
      subtitle="Connectez-vous à votre compte pour continuer à créer de puissantes automatisations"
      visualType="login"
    >
      <LoginForm />
    </AuthLayout>
  )
}
