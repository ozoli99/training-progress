import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="font-semibold tracking-tight">
      Training <span className="text-primary">Progress</span>
    </Link>
  );
}
