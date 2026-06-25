import Link from "next/link";
import { Logo } from "@/components/aegis/logo";

const SECTIONS = [
  {
    title: "Acceptance",
    body: "By using AEGIS, you accept these terms.",
  },
  {
    title: "Permitted use",
    body: "AEGIS is for capstone project allocation at your institution. Use it only for its intended purpose.",
  },
  {
    title: "Prohibited use",
    body: "Do not attempt to manipulate the allocation algorithm, access other users' data, or reverse-engineer the health scoring system.",
  },
  {
    title: "No warranty",
    body: "This is a prototype built for a competition. It is provided as-is without warranty of any kind.",
  },
  {
    title: "Intellectual property",
    body: "The AEGIS engine, dashboard, and documentation are the work of Team The Amateurs for CIPHER 2.0.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] bg-background px-5 py-12 text-foreground">
      <article className="mx-auto max-w-[680px]">
        <header className="mb-10">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">Terms of Use</h1>
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
