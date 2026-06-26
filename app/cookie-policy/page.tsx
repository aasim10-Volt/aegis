import Link from "next/link";
import { Logo } from "@/components/aegis/logo";

export default function CookiePolicyPage() {
  return (
    <main className="min-h-[100dvh] bg-background px-5 py-12 text-foreground">
      <article className="mx-auto max-w-[680px]">
        <header className="mb-10">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">Cookie Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>
        </header>
        <section>
          <h2 className="text-lg font-semibold">Strictly necessary cookies</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            AEGIS uses one session cookie for authentication through Supabase. It does not use
            advertising cookies or tracking cookies. This cookie is required for sign-in and
            cannot be disabled without logging out.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">No third-party tracking</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            No analytics, advertising, or third-party tracking scripts are loaded by AEGIS. The
            only external service is Supabase for authentication and database access, which sets
            the session cookie described above.
          </p>
        </section>
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
