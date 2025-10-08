import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
};

export function FeatureCard({ title, description, icon, href }: Props) {
  return (
    <Link
      href={href}
      className="group block focus:outline-none"
      aria-label={`${title} - ${description}`}
    >
      <Card
        className={[
          "relative transition-all",
          "hover:-translate-y-0.5 hover:shadow-lg",
          "focus-visible:ring-2 focus-visible:ring-primary",
        ].join(" ")}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        />

        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-accent text-accent-foreground",
                  "bg-gradient-to-b from-background to-muted/60",
                ].join(" ")}
              >
                {icon}
              </span>
              <div className="flex flex-col">
                <span className="font-medium leading-none">{title}</span>
              </div>
            </div>

            <ChevronRight
              className="h-4 w-4 text-muted-foreground transition-all duration-200 translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              aria-hidden="true"
            />
          </div>

          <p className="mt-3 text-sm text-muted-foreground">{description}</p>

          <div className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
            <span className="underline-offset-4 group-hover:underline">
              Open
            </span>
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
