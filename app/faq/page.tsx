import Link from "next/link";
import { Logo } from "@/components/aegis/logo";

const FAQS = [
  {
    q: "Who can log in to AEGIS?",
    a: "AEGIS has three roles: students, lecturers, and administrators. Students see their own team workspace. Lecturers monitor all teams. Administrators manage approvals and view the full governance panel.",
  },
  {
    q: "How are teams formed?",
    a: "The engine uses a maximin algorithm that maximizes the capability floor. The weakest team is made as strong as possible rather than optimizing the average. No team is sacrificed for another.",
  },
  {
    q: "What is the health score?",
    a: "A 0 to 100 score computed from four signals: engagement, workload balance, task completion, and milestone progress. Scores below 65 trigger a Needs Attention alert. Scores below 45 trigger a Critical alert.",
  },
  {
    q: "Is the data real student data?",
    a: "The demonstration runs on synthetic data generated for this prototype. No real student records are used. All sample profiles use RFC 2606 reserved email addresses.",
  },
  {
    q: "How is the audit log tamper-evident?",
    a: "Each entry includes a hash of the previous entry's content. Any change to a past entry breaks the hash chain, which the integrity check detects and flags immediately.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-[100dvh] bg-background px-5 py-12 text-foreground">
      <article className="mx-auto max-w-[680px]">
        <header className="mb-10">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">Frequently asked questions</h1>
        </header>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-foreground hover:bg-secondary">
                <span>{q}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <p className="px-5 pb-4 pt-1 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <Link
          href="/"
          className="mt-10 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Back to home
        </Link>
      </article>
    </main>
  );
}
