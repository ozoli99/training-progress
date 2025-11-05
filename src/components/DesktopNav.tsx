import Link from "next/link";
import { isActive } from "@/lib/utils";
import { NavItem } from "@/lib/types";

type Props = {
  items: NavItem[];
  pathname: string;
};

export function DesktopNav({ items, pathname }: Props) {
  return (
    <nav className="ml-6 hidden md:flex items-center gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            ].join(" ")}
          >
            {Icon ? <Icon size={16} /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
