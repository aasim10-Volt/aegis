import Link from "next/link";
import { Logo } from "@/components/aegis/logo";

const SECTIONS = [
  {
    title: "What we collect",
    body: "AEGIS collects your email address for authentication and usage patterns needed for monitoring team health. It does not collect payment data or unnecessary personal information.",
  },
  {
    title: "How we use it",
    body: "We use this data to authenticate you, compute team health scores, and generate the audit log. AEGIS does not sell your data to third parties.",
  },
  {
    title: "Google sign-in",
    body: "If you use Google OAuth, Google sends us your name and email address. We store the email address for account access.",
  },
  {
    title: "Data retention",
    body: "Session data is cleared on sign-out. Allocation results are stored in Supabase and protected with row-level security.",
  },
  {
    title: "Your rights",
    body: "You can request deletion of your account and data by contacting the administrator for your AEGIS workspace.",
  },
  {
    title: "Contact",
    body: "For privacy requests, contact admin@example.edu.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] bg-background px-5 py-12 text-foreground">
      <article className="mx-auto max-w-[680px]">
        <header className="mb-10">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>
        </header>
        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
        <Link href="/" className="mt-10 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary">
          Back to AEGIS
        </Link>
      </article>
    </main>
  );
}
