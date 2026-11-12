import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Card, Container, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = pageMetadata({ title: "Contact", description: "Contact the Science & Innovation Club at Government Engineering College, Palamu: questions, collaborations and event queries.", path: "/contact" });

// Replace with the club's real handles and address before launch.
// wa.me needs the country code (91 for India) in front of the number.
const WHATSAPP = `https://wa.me/916207163458?text=${encodeURIComponent("Hi SIC! I have a question about ")}`;

const CHANNELS = [
  { label: "WhatsApp", value: "Chat with us: +91 62071 63458", href: WHATSAPP },
  { label: "Email", value: "sic.gecpalamu@gmail.com", href: null },
  { label: "Instagram", value: "@sic_club", href: "https://instagram.com/sic_gecp/" },
  { label: "LinkedIn", value: "Science & Innovation Club", href: "https://linkedin.com/" },
];

export default function ContactPage() {
  return (
    <Container className="flex flex-col gap-10 py-12">
      <PageHeader hud
        eyebrow="Contact"
        title="Get in touch"
        description="Questions about events, sponsorships or collaborations? Reach the club through any of these."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((c) => (
          <Card key={c.label} className="flex flex-col gap-1 p-5">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">{c.label}</span>
            {c.href ? (
              <a href={c.href} target="_blank" rel="noreferrer" className="font-medium hover:text-primary">
                {c.value} ↗
              </a>
            ) : (
              <span className="select-all font-medium">{c.value}</span>
            )}
          </Card>
        ))}
      </div>
      <Card className="flex flex-col gap-1 p-5">
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">Find us</span>
        <span className="font-medium">SIC Lab, Main Academic Block</span>
        <span className="text-sm text-muted">Open for members on weekday evenings during term.</span>
      </Card>
    </Container>
  );
}
