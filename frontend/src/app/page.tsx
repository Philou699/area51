import { HeroSection } from "@/components/home/hero-section"
import { StatsSection } from "@/components/home/stats-section"
import { WorkflowVisual } from "@/components/home/workflow-visual"
import { IntegrationsShowcase } from "@/components/home/integrations-showcase"
import { FeaturesGrid } from "@/components/home/features-grid"
import { CTASection } from "@/components/home/cta-section"
import ServicesCarousel from "@/components/home/ServicesCarousel"

export default function HomePage() {
  return (
    <div className="page-background flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <ServicesCarousel />
        <WorkflowVisual />
        <IntegrationsShowcase />
        <FeaturesGrid />
        <CTASection />
      </main>
    </div>
  )
}
