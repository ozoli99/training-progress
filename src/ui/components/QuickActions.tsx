import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Link href="/log">
        <Button
          size="sm"
          aria-label="Quick add log"
          className="hidden sm:inline-flex"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Log
        </Button>
      </Link>
    </div>
  );
}
