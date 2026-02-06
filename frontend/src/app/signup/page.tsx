import { AuthLayout } from "@/components/auth/auth-layout"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Commencez à automatiser dès aujourd&apos;hui"
      subtitle="Créez votre compte et connectez votre premier workflow en quelques minutes"
      visualType="register"
    >
      <RegisterForm />
    </AuthLayout>
  )
}
