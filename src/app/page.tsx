import { HeroSection } from "@/ui/components/HeroSection";
import { FeatureGrid } from "@/ui/components/FeatureGrid";

export default function Home() {
  return (
    <div className="space-y-10">
      <HeroSection />
      <FeatureGrid />
    </div>
  );
}
