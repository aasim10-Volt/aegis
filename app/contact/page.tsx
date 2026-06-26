import Link from "next/link";
import { Logo } from "@/components/aegis/logo";

export default function ContactPage() {
  return (
    <main className="min-h-[100dvh] bg-background px-5 py-12 text-foreground">
      <article className="mx-auto max-w-[680px]">
        <header className="mb-10">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">Contact</h1>
        </header>
        <p className="text-sm leading-relaxed text-muted-foreground">
          For support or queries about AEGIS, contact the team via the GitHub repository.
        </p>
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
