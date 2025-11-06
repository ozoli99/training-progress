import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between p-3 border-b">
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/org/:id/dashboard"
          afterCreateOrganizationUrl="/org/:id/dashboard"
        />
        <UserButton afterSignOutUrl="/" />
      </header>
      <main>{children}</main>
    </div>
  );
}
