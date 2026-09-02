export default function Footer() {
  return (
    <footer className="border-t border-paper/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs text-paper/40 sm:flex-row sm:px-10">
        <span className="font-serif text-base tracking-wide text-paper/70">
          MIRAGE<span className="text-beige-300"> DATA</span>
        </span>
        <span>© {new Date().getFullYear()} Mirage Data. Alle Rechte vorbehalten.</span>
        <div className="flex gap-6">
          <a href="#top" className="transition-colors hover:text-paper">
            Nach oben
          </a>
        </div>
      </div>
    </footer>
  );
}
