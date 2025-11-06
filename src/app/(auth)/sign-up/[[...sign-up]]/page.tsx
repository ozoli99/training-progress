import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <SignUp path="/sign-up" routing="path" forceRedirectUrl="/onboarding" />
    </div>
  );
}
