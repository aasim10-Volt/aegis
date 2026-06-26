import Link from "next/link";
import { Logo } from "@/components/aegis/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 text-foreground">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
