import { HeroSection } from "@/components/HeroSection";
import { FeatureGrid } from "@/components/FeatureGrid";

export default function Home() {
  return (
    <div className="space-y-10">
      <HeroSection />
      <FeatureGrid />
    </div>
  );
}
