"use client";

import Image from "next/image";
import { CSSProperties, useEffect, useRef, useState } from "react";

type Project = {
  number: string;
  name: string;
  category: string;
  headline: string;
  summary: string;
  built: string;
  motion: string;
  impact: string;
  accent: string;
  glow: string;
  images: [string, string, string];
  tags: string[];
};

const PROJECTS: Project[] = [
  {
    number: "01",
    name: "Sustain Estates",
    category: "Real Estate · Strategy · Web",
    headline: "Transformation wird sichtbar, bevor sie gebaut wird.",
    summary:
      "Eine digitale Marken- und Produktwelt für nachhaltige Immobilienentwicklung — vom Bestand bis zur belastbaren Investitionsentscheidung.",
    built:
      "Strategische Website, Case-Study-System, FaaS-Kommunikation und eine klare visuelle Übersetzung komplexer Immobilienprozesse.",
    motion:
      "Architektur-Layer bewegen sich räumlich vom Bestand zur Zukunft. Schwebende Screens machen Daten, Gebäude und Ergebnis gleichzeitig erfassbar.",
    impact:
      "Komplexe Leistungen werden schneller verstanden. Das stärkt Vertrauen, erhöht die wahrgenommene Projektqualität und verkürzt den Weg zum Gespräch.",
    accent: "#b9d58c",
    glow: "rgba(138, 176, 91, 0.28)",
    images: [
      "/portfolio/sustain-hero.png",
      "/portfolio/sustain-brand.png",
      "/portfolio/sustain-faas.png",
    ],
    tags: ["Positionierung", "UX-System", "Immobilienvisualisierung"],
  },
  {
    number: "02",
    name: "Bahadorifar",
    category: "Psychotherapie · Brand Experience",
    headline: "Digitale Ruhe schafft Vertrauen vor dem ersten Gespräch.",
    summary:
      "Eine sensible Praxiswebsite, die Kompetenz und Sicherheit vermittelt, ohne klinisch oder distanziert zu wirken.",
    built:
      "Markenbild, Informationsarchitektur, responsive Website und eine ruhige Nutzerführung für Therapieangebote und Erstkontakt.",
    motion:
      "Transparente Ebenen gleiten langsam durch einen hellen Raum. Die reduzierte Bewegung führt den Blick, ohne die emotionale Ruhe zu stören.",
    impact:
      "Ein klarer, geschützter Auftritt senkt die Kontaktbarriere. Besucher finden schneller Orientierung und gewinnen früher Vertrauen in die Praxis.",
    accent: "#aeb9a2",
    glow: "rgba(222, 227, 214, 0.34)",
    images: [
      "/portfolio/bahadorifar-home.png",
      "/portfolio/bahadorifar-section.png",
      "/portfolio/bahadorifar-method.png",
    ],
    tags: ["Brand Design", "Content UX", "Vertrauensaufbau"],
  },
  {
    number: "03",
    name: "EVO Classic",
    category: "Sports · Event · Commerce",
    headline: "Eine digitale Bühne, die Energie in Handlung verwandelt.",
    summary:
      "Ein immersives Event-Ökosystem für Natural Bodybuilding — von der ersten Gänsehaut bis zum Ticket und Sponsoringkontakt.",
    built:
      "Event-Website, 3D-Tickets, Membership-Flows, Sponsoring-Erlebnis und eine medienreiche Produkt- und Community-Präsentation.",
    motion:
      "Kamerafahrten, Bühnenlicht und gestaffelte Medienflächen erzeugen den Rhythmus eines Live-Events und verbinden alle Angebote in einer Geschichte.",
    impact:
      "Die Inszenierung steigert Aufmerksamkeit und Erinnerungswert. Klare Übergänge führen gezielt zu Tickets, Partnerschaften und Community-Angeboten.",
    accent: "#ff3b32",
    glow: "rgba(255, 36, 54, 0.30)",
    images: [
      "/portfolio/evo-home.png",
      "/portfolio/evo-experience.jpg",
      "/portfolio/evo-athlete.jpg",
    ],
    tags: ["3D Commerce", "Event Storytelling", "Conversion UX"],
  },
];

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

const sceneOpacity = (progress: number, isLast: boolean) => {
  if (progress < 0.13) return smooth(progress / 0.13);
  if (!isLast && progress > 0.84) return smooth((1 - progress) / 0.16);
  if (isLast && progress > 0.93) return smooth((1 - progress) / 0.07);
  return 1;
};

/**
 * Tracks, per "chapter" (one tall wrapper per project), how far the
 * visitor has scrolled through it while it's pinned — 0 when the chapter
 * just reached the top of the viewport, 1 right before it releases. This
 * is what actually drives the 3D scene; without it the composition never
 * moves and just sits on one static pose.
 */
function useChapterScrollProgress(count: number) {
  const chapterRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [progress, setProgress] = useState<number[]>(() =>
    Array(count).fill(0)
  );

  useEffect(() => {
    let lastKey = "";

    // Driven directly by real scroll/resize events rather than a
    // free-running requestAnimationFrame loop — cheaper when idle, and
    // (unlike rAF) not silently throttled by browsers on a backgrounded
    // or momentarily hidden tab.
    const measure = () => {
      const vh = window.innerHeight || 1;
      const next = chapterRefs.current.map((el) => {
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const scrollable = rect.height - vh;
        if (scrollable <= 0) return rect.top <= 0 ? 1 : 0;
        return clamp(-rect.top / scrollable);
      });
      const key = next.map((n) => n.toFixed(3)).join(",");
      if (key !== lastKey) {
        lastKey = key;
        setProgress(next);
      }
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [count]);

  return { chapterRefs, progress };
}

function BrowserFrame({
  src,
  label,
  className,
  style,
  priority = false,
}: {
  src: string;
  label: string;
  className: string;
  style: CSSProperties;
  priority?: boolean;
}) {
  return (
    <figure
      aria-label={label}
      className={`absolute overflow-hidden rounded-[1.1rem] border border-white/15 bg-[#11110f] shadow-[0_45px_120px_rgba(0,0,0,.62)] ${className}`}
      style={style}
    >
      <div className="flex h-7 items-center gap-1.5 border-b border-white/10 bg-black/70 px-3 backdrop-blur-md">
        <i className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <i className="h-1.5 w-1.5 rounded-full bg-white/15" />
        <i className="h-1.5 w-1.5 rounded-full bg-white/10" />
        <span className="ml-2 text-[0.5rem] uppercase tracking-[0.2em] text-white/30">
          {label}
        </span>
      </div>
      <div className="relative h-[calc(100%-1.75rem)] w-full">
        <Image
          src={src}
          alt={`${label} – Websiteansicht`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 90vw, 62vw"
          className="object-cover object-top"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />
      </div>
    </figure>
  );
}

function ProjectScene({
  project,
  index,
  progress,
}: {
  project: Project;
  index: number;
  progress: number;
}) {
  const eased = smooth(progress);
  const opacity = sceneOpacity(progress, index === PROJECTS.length - 1);
  const direction = index % 2 === 0 ? 1 : -1;
  const cameraZ = -180 + Math.sin(eased * Math.PI) * 250;
  const drift = (eased - 0.5) * 90;

  const mainStyle: CSSProperties = {
    opacity,
    transform: `translate(-50%, -50%) translate3d(${drift * direction}px, ${
      34 - eased * 68
    }px, ${cameraZ}px) rotateX(${4 - eased * 8}deg) rotateY(${
      direction * (11 - eased * 22)
    }deg) scale(${0.82 + eased * 0.22})`,
  };
  const sideAStyle: CSSProperties = {
    opacity: opacity * clamp((progress - 0.12) / 0.2),
    transform: `translate(-50%, -50%) translate3d(${direction * (-390 + eased * 110)}px, ${
      -165 + eased * 78
    }px, ${-390 + eased * 160}px) rotateY(${direction * 24}deg) rotateZ(${
      direction * -4
    }deg)`,
  };
  const sideBStyle: CSSProperties = {
    opacity: opacity * clamp((progress - 0.22) / 0.2),
    transform: `translate(-50%, -50%) translate3d(${direction * (410 - eased * 100)}px, ${
      175 - eased * 54
    }px, ${-330 + eased * 130}px) rotateY(${direction * -21}deg) rotateZ(${
      direction * 3
    }deg)`,
  };

  return (
    <article
      className="pointer-events-none absolute inset-0 overflow-hidden transition-[visibility] duration-300"
      style={{ visibility: opacity < 0.015 ? "hidden" : "visible" }}
      aria-hidden={opacity < 0.2}
      data-portfolio-project={project.name}
    >
      <div
        className="absolute inset-0"
        style={{
          opacity,
          background: `radial-gradient(circle at ${
            index % 2 ? "28% 45%" : "72% 42%"
          }, ${project.glow}, transparent 46%), linear-gradient(145deg, #0b0b0a 0%, #12110f 54%, #070706 100%)`,
        }}
      />

      <div className="absolute inset-0 [perspective:1500px] [transform-style:preserve-3d]">
        <div
          className="absolute left-1/2 top-1/2 h-[58vh] w-[64vw] max-w-[920px] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]"
        >
          <BrowserFrame
            src={project.images[0]}
            label={`${project.name} · Start`}
            priority={index === 0}
            className="left-1/2 top-1/2 h-[52vh] w-[60vw] max-w-[860px] -translate-x-1/2 -translate-y-1/2"
            style={mainStyle}
          />
          <BrowserFrame
            src={project.images[1]}
            label={`${project.name} · System`}
            className="left-1/2 top-1/2 h-[26vh] w-[30vw] max-w-[430px] -translate-x-1/2 -translate-y-1/2"
            style={sideAStyle}
          />
          <BrowserFrame
            src={project.images[2]}
            label={`${project.name} · Experience`}
            className="left-1/2 top-1/2 h-[24vh] w-[28vw] max-w-[400px] -translate-x-1/2 -translate-y-1/2"
            style={sideBStyle}
          />
        </div>
      </div>

      <div
        className="absolute bottom-[8vh] left-[5vw] z-10 w-[min(34rem,42vw)]"
        style={{
          opacity: opacity * clamp((progress - 0.08) / 0.18),
          transform: `translate3d(0, ${34 - eased * 34}px, 0)`,
        }}
      >
        <div
          className="mb-4 flex items-center gap-4"
        >
          <span className="font-serif text-5xl font-light text-white/20">
            {project.number}
          </span>
          <span
            className="text-[0.62rem] uppercase tracking-[0.28em]"
            style={{ color: project.accent }}
          >
            {project.category}
          </span>
        </div>
        <h3 className="text-balance font-serif text-4xl font-light leading-[1.02] text-paper lg:text-5xl">
          {project.headline}
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-paper/60">
          {project.summary}
        </p>
        <div
          className="mt-5 flex flex-wrap gap-2"
        >
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.14em] text-white/55 backdrop-blur-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <aside
        className="absolute right-[5vw] top-[17vh] z-10 w-[min(21rem,28vw)] rounded-2xl border border-white/10 bg-black/55 px-5 shadow-2xl backdrop-blur-xl"
        style={{ opacity: opacity * clamp((progress - 0.38) / 0.22) }}
      >
        {[
          ["Was wir gebaut haben", project.built],
          ["3D & Motion", project.motion],
          ["Business-Wirkung", project.impact],
        ].map(([title, copy]) => (
          <div
            key={title}
            className="border-t border-white/12 py-4 backdrop-blur-sm"
          >
            <strong
              className="text-[0.58rem] uppercase tracking-[0.22em]"
              style={{ color: project.accent }}
            >
              {title}
            </strong>
            <p className="mt-2 text-xs leading-relaxed text-white/52">{copy}</p>
          </div>
        ))}
      </aside>
    </article>
  );
}

function PortfolioFallback() {
  return (
    <div className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <span className="text-xs uppercase tracking-[0.35em] text-beige-400">
          Portfolio
        </span>
        <h2 className="mt-4 max-w-3xl text-balance font-serif text-4xl font-light leading-[1.08] text-paper sm:text-5xl">
          Drei digitale Welten. Ein Anspruch: Wirkung, die bleibt.
        </h2>
        <div className="mt-14 grid gap-8">
          {PROJECTS.map((project) => (
            <article
              key={project.name}
              className="overflow-hidden rounded-3xl border border-paper/10 bg-ink-soft"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={project.images[0]}
                  alt={`${project.name} Website`}
                  fill
                  sizes="100vw"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
                  <span
                    className="text-[0.6rem] uppercase tracking-[0.24em]"
                    style={{ color: project.accent }}
                  >
                    {project.category}
                  </span>
                  <h3 className="mt-2 font-serif text-3xl text-white">
                    {project.name}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
                    {project.summary}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { chapterRefs, progress } = useChapterScrollProgress(PROJECTS.length);

  return (
    <section
      id="portfolio"
      className="relative bg-ink"
      aria-label="Ausgewählte Mirage Data Projekte"
    >
      <div className="md:hidden">
        <PortfolioFallback />
      </div>

      <div className="hidden md:block">
        {PROJECTS.map((project, index) => (
          <div
            key={project.name}
            ref={(el) => {
              chapterRefs.current[index] = el;
            }}
            className="portfolio-scroll-chapter relative h-[155vh] bg-[#080807]"
          >
            <div className="portfolio-scroll-scene sticky top-0 h-screen overflow-hidden bg-[#080807]">
              <div className="pointer-events-none absolute inset-0 z-20 border-[clamp(.75rem,2vw,1.75rem)] border-[#080807]" />
              <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

              <ProjectScene
                project={project}
                index={index}
                progress={progress[index] ?? 0}
              />

              <header className="absolute left-[4vw] right-[4vw] top-[4vh] z-30 flex items-start justify-between">
                <div>
                  <span className="text-[0.58rem] uppercase tracking-[0.35em] text-beige-400">
                    Selected work · Spatial portfolio
                  </span>
                  <p className="mt-2 text-xs text-white/35">
                    Scrollen bewegt die Kamera durch drei digitale Welten.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.6rem] tabular-nums tracking-[0.2em] text-white/45">
                    {String(index + 1).padStart(2, "0")} / 03
                  </span>
                  <div className="h-px w-28 bg-white/20">
                    <div
                      className="h-full bg-beige-300"
                      style={{ width: `${((index + 1) / PROJECTS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </header>
            </div>
          </div>
        ))}

        <div className="relative h-[110vh] bg-paper text-ink">
          <div className="sticky top-0 flex h-screen items-center justify-center text-center">
            <div>
              <span className="text-[0.6rem] uppercase tracking-[0.38em] text-beige-600">
                Mirage Data
              </span>
              <p className="mt-5 text-balance font-serif text-6xl font-light leading-none lg:text-8xl">
                Design, das<br />Geschäft bewegt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
