import { Button } from "@/components/ui/button";
import { Cta } from "@/lib/types";
import Link from "next/link";

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
