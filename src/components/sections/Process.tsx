import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const STEPS = [
  {
    n: "01",
    title: "Analyse",
    text: "Wir hören zu, verstehen Ihr Problem oder Vorhaben und prüfen den technischen Rahmen.",
  },
  {
    n: "02",
    title: "Konzept",
    text: "Klare Empfehlung, transparenter Plan — ohne unnötige Komplexität.",
  },
  {
    n: "03",
    title: "Umsetzung",
    text: "Entwicklung oder Problemlösung in enger Abstimmung, mit regelmäßigen Updates.",
  },
  {
    n: "04",
    title: "Betreuung",
    text: "Auch nach dem Launch bleiben wir Ansprechpartner für Wartung und Weiterentwicklung.",
  },
];

export default function Process() {
  return (
    <section id="ablauf" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Ablauf"
          title="Vier Schritte zu einer ruhigen IT."
          align="center"
        />

        <div className="relative mt-20 grid gap-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute inset-x-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-paper/15 to-transparent lg:block" />
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 110} className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-beige-300/40 bg-ink font-serif text-lg text-beige-300">
                {step.n}
              </div>
              <h3 className="mt-6 font-serif text-xl font-light text-paper">
                {step.title}
              </h3>
              <p className="mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed text-paper/55">
                {step.text}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
