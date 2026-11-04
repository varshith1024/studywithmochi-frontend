import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-12 sm:flex-row sm:items-center lg:px-10">
        <p className="text-ink-dim">Mochi is waiting on the couch. Ready for your first session?</p>
        <Link href="/register" className="rounded-full bg-gradient-to-b from-mochi to-mochi-deep px-7 py-3 text-sm font-semibold text-white transition hover:brightness-110">
          Create your account
        </Link>
      </div>
    </footer>
  );
}
