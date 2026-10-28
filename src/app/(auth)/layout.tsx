import { Logo } from "@/components/layout/logo";
import { SetupNotice } from "@/components/layout/setup-notice";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <SetupNotice />
      <header className="mx-auto flex h-16 w-full max-w-content items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:pt-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
