import Reveal from "@/components/ui/Reveal";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden pt-20"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/3 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, var(--beige-400) 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,var(--ink)_75%)]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <Reveal>
            <span className="text-xs uppercase tracking-[0.4em] text-beige-400">
              IT Consulting &amp; digitale Lösungen
            </span>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-6 text-balance font-serif text-5xl font-light leading-[1.05] text-paper sm:text-6xl md:text-7xl lg:text-[5.25rem]">
              Klarheit für Ihre <em className="text-beige-300 not-italic">IT</em>,
              gebaut wie ein Handwerk.
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper/60">
              Mirage Data begleitet Menschen und Unternehmen durch IT-Probleme,
              entwickelt Apps, Websites und digitale Lösungen — ruhig durchdacht,
              präzise umgesetzt.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a
                href="#kontakt"
                className="rounded-full bg-paper px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-beige-300"
              >
                Beratungsgespräch anfragen
              </a>
              <a
                href="#portfolio"
                className="text-sm text-paper/70 underline decoration-beige-400/40 underline-offset-4 transition-colors hover:text-paper hover:decoration-beige-300"
              >
                Ausgewählte Projekte ansehen
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={280} className="lg:pb-3">
          <dl className="grid grid-cols-3 gap-6 border-t border-paper/10 pt-6 lg:grid-cols-1 lg:divide-y lg:divide-paper/10 lg:border-t-0">
            {[
              { k: "IT-Support", v: "Für Menschen & Firmen" },
              { k: "Entwicklung", v: "Apps & Websites" },
              { k: "Lösungen", v: "Software & Digitalisierung" },
            ].map((item) => (
              <div key={item.k} className="lg:py-5 lg:first:pt-0">
                <dt className="font-serif text-2xl text-paper">{item.k}</dt>
                <dd className="mt-1 text-sm text-paper/50">{item.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <div className="absolute inset-x-0 bottom-8 flex justify-center">
        <span className="flex flex-col items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-paper/40">
          Scrollen
          <span className="h-10 w-px animate-pulse bg-gradient-to-b from-beige-300 to-transparent" />
        </span>
      </div>
    </section>
  );
}
