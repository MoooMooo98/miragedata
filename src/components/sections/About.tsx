import Reveal from "@/components/ui/Reveal";

const VALUES = [
  { k: "Klarheit", v: "Verständliche Lösungen statt Fachchinesisch." },
  { k: "Präzision", v: "Sauberer Code, durchdachte Architektur." },
  { k: "Nähe", v: "Direkter Kontakt statt Ticket-Systeme." },
];

export default function About() {
  return (
    <section id="ueber-uns" className="relative py-28 sm:py-36">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 sm:px-10 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <span className="text-xs uppercase tracking-[0.35em] text-beige-400">
            Über Mirage Data
          </span>
          <h2 className="mt-4 text-balance font-serif text-4xl font-light leading-[1.15] text-paper sm:text-5xl">
            Technologie sollte sich <em className="text-beige-300 not-italic">leise</em> anfühlen —
            nicht kompliziert.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-paper/60 sm:text-lg">
            Mirage Data wurde gegründet, um Menschen und Unternehmen von
            IT-Frust zu befreien. Wir übersetzen komplexe technische
            Anforderungen in ruhige, verlässliche Lösungen — als App, als
            Website oder als individuelle Software. Kein Projekt ist uns zu
            klein, keine Herausforderung zu groß.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-paper/10 bg-paper/10 sm:grid-cols-1">
            {VALUES.map((item) => (
              <div
                key={item.k}
                className="flex items-baseline justify-between gap-6 bg-ink px-8 py-7"
              >
                <span className="font-serif text-xl text-paper">{item.k}</span>
                <span className="max-w-[14rem] text-right text-sm text-paper/50">
                  {item.v}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
