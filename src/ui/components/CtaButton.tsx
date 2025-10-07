import { Button } from "@/components/ui/button";
import Link from "next/link";

export type Cta = {
  href: string;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "secondary" | "ghost";
};

export function CtaButton({ href, label, icon, variant = "default" }: Cta) {
  return (
    <Button asChild size="sm" className="sm:h-9" variant={variant}>
      <Link href={href}>
        {icon}
        {label}
      </Link>
    </Button>
  );
}
