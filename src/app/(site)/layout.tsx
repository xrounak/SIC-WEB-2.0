import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SetupNotice } from "@/components/layout/setup-notice";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <SetupNotice />
      <main id="main" className="relative z-10">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
