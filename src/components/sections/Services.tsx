import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const SERVICES = [
  {
    title: "IT-Support & Beratung",
    text: "Wir lösen IT-Probleme für Privatpersonen und Unternehmen — von der ersten Analyse bis zur nachhaltigen Betreuung.",
    icon: (
      <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.95 5.95-2.12-2.12M8.17 8.17 6.05 6.05m11.9 0-2.12 2.12M8.17 15.83l-2.12 2.12M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
    ),
  },
  {
    title: "App-Entwicklung",
    text: "Native und plattformübergreifende Apps, die durchdacht wirken — von der Idee bis zum Rollout.",
    icon: (
      <path d="M9 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm2.5 15.5h1" />
    ),
  },
  {
    title: "Webentwicklung",
    text: "Websites und Web-Anwendungen mit hoher Gestaltungsqualität, klarer Architektur und starker Performance.",
    icon: (
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm0 3h16M8 4v5" />
    ),
  },
  {
    title: "Digitale Lösungen",
    text: "Software, Automatisierung und Digitalisierungs­strategien, die Ihre Prozesse spürbar vereinfachen.",
    icon: (
      <path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Zm-3 10.5 2 2 4-4.5" />
    ),
  },
];

export default function Services() {
  return (
    <section id="leistungen" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Leistungen"
          title="Ein Partner für alles, was digital ist."
          description="Vom akuten IT-Problem bis zur langfristigen Digitalstrategie — wir übernehmen Verantwortung für Ihre technische Landschaft."
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-paper/10 bg-paper/10 sm:grid-cols-2">
          {SERVICES.map((service, i) => (
            <Reveal
              key={service.title}
              delay={i * 90}
              className="group relative bg-ink p-8 transition-colors duration-500 hover:bg-ink-soft sm:p-10"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-9 w-9 text-beige-300 transition-transform duration-500 group-hover:scale-110"
              >
                {service.icon}
              </svg>
              <h3 className="mt-8 font-serif text-2xl font-light text-paper">
                {service.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/55">
                {service.text}
              </p>
              <span className="absolute right-8 top-8 font-serif text-sm text-paper/20 sm:right-10 sm:top-10">
                0{i + 1}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
