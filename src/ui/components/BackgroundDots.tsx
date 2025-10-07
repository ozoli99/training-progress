export function BackgroundDots() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]"
      style={{
        backgroundImage:
          "radial-gradient(1px 1px at 20px 20px, hsl(var(--muted-foreground)) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
}
