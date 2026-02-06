import { FeaturesHero } from "@/components/features/features-hero"
import { CapabilitiesShowcase } from "@/components/features/capabilities-showcase"
import { InteractiveDemo } from "@/components/features/interactive-demo"
import { ComparisonSection } from "@/components/features/comparison-section"
import { TechnicalSpecs } from "@/components/features/technical-specs"
import { FeaturesCTA } from "@/components/features/features-cta"

export default function FeaturesPage() {
  return (
    <div className="page-background flex min-h-screen flex-col">
      <main className="flex-1">
        <FeaturesHero />
        <CapabilitiesShowcase />
        <InteractiveDemo />
        <ComparisonSection />
        <TechnicalSpecs />
        <FeaturesCTA />
      </main>
    </div>
  )
}
