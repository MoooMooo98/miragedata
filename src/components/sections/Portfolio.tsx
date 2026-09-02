"use client";

import Image from "next/image";
import { CSSProperties, useEffect, useRef, useState } from "react";
import PortfolioWebGL from "@/components/sections/PortfolioWebGL";

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

function usePortfolioMotion() {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    let last = -1;

    const measure = () => {
      frame = 0;
      const el = stageRef.current;
      if (!el) return;
      const vh = window.innerHeight || 1;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - vh;
      const next = scrollable > 0 ? clamp(-rect.top / scrollable) : 0;
      if (Math.abs(next - last) > 0.0005) {
        last = next;
        setProgress(next);
      }
    };

    const requestMeasure = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    requestMeasure();
    window.addEventListener("scroll", requestMeasure, { passive: true });
    window.addEventListener("resize", requestMeasure);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestMeasure);
      window.removeEventListener("resize", requestMeasure);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;

    const render = () => {
      current.x += (target.x - current.x) * 0.075;
      current.y += (target.y - current.y) * 0.075;
      root.style.setProperty("--portfolio-x", `${current.x * 22}px`);
      root.style.setProperty("--portfolio-y", `${current.y * 14}px`);
      root.style.setProperty("--portfolio-rx", `${current.y * -3.2}deg`);
      root.style.setProperty("--portfolio-ry", `${current.x * 4.6}deg`);
      root.style.setProperty(
        "--portfolio-cursor-x",
        `${50 + current.x * 28}%`,
      );
      root.style.setProperty(
        "--portfolio-cursor-y",
        `${50 + current.y * 24}%`,
      );

      const moving =
        Math.abs(target.x - current.x) > 0.001 ||
        Math.abs(target.y - current.y) > 0.001;
      frame = moving ? requestAnimationFrame(render) : 0;
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      target.x = clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1);
      target.y = clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1);
      start();
    };

    const onPointerLeave = () => {
      target.x = 0;
      target.y = 0;
      start();
    };

    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", onPointerLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return { rootRef, stageRef, progress };
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
      -96 + eased * 42
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

      <div className="absolute inset-0 [perspective:1600px] [transform-style:preserve-3d]">
        <div className="portfolio-parallax-rig absolute inset-0 [transform-style:preserve-3d]">
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
      </div>

      <div
        className="absolute bottom-[8vh] left-[5vw] z-10 w-[min(34rem,42vw)]"
        style={{
          opacity: opacity * clamp((progress - 0.04) / 0.14),
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
        style={{ opacity: opacity * clamp((progress - 0.3) / 0.22) }}
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
                  sizes="(max-width: 1023px) 100vw, 1px"
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
  const { rootRef, stageRef, progress } = usePortfolioMotion();
  const sceneProgress = PROJECTS.map((_, index) =>
    clamp((progress * PROJECTS.length - index + 0.2) / 1.2),
  );
  const activeIndex = Math.min(
    PROJECTS.length - 1,
    Math.max(0, Math.floor(progress * PROJECTS.length)),
  );

  return (
    <section
      ref={rootRef}
      id="portfolio"
      className="relative bg-ink"
      aria-label="Ausgewählte Mirage Data Projekte"
    >
      <div className="portfolio-static-fallback lg:hidden">
        <PortfolioFallback />
      </div>

      <div className="portfolio-immersive-stage hidden lg:block">
        <div ref={stageRef} className="relative h-[460vh] bg-[#080807]">
          <div className="portfolio-sticky-viewport sticky top-20 h-[calc(100vh-5rem)] overflow-hidden bg-[#080807]">
            <PortfolioWebGL progress={progress} />
            <div
              className="pointer-events-none absolute inset-0 z-[5]"
              style={{
                background:
                  "radial-gradient(circle at var(--portfolio-cursor-x, 50%) var(--portfolio-cursor-y, 50%), rgba(219,199,161,.09), transparent 34%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 z-20 border-[clamp(.75rem,2vw,1.75rem)] border-[#080807]" />
            <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

            {PROJECTS.map((project, index) => (
              <ProjectScene
                key={project.name}
                project={project}
                index={index}
                progress={sceneProgress[index]}
              />
            ))}

            <header className="absolute left-[4vw] right-[4vw] top-[4vh] z-30 flex items-start justify-between">
              <div>
                <span className="text-[0.58rem] uppercase tracking-[0.35em] text-beige-400">
                  Selected work · Spatial portfolio
                </span>
                <p className="mt-2 text-xs text-white/35">
                  Scrollen bewegt die Kamera · Der Cursor verschiebt die Tiefe.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[0.6rem] tabular-nums tracking-[0.2em] text-white/45">
                  {String(activeIndex + 1).padStart(2, "0")} / 03
                </span>
                <div className="h-px w-28 overflow-hidden bg-white/20">
                  <div
                    className="h-full origin-left bg-beige-300"
                    style={{ transform: `scaleX(${progress})` }}
                  />
                </div>
              </div>
            </header>

            <div className="pointer-events-none absolute bottom-[4vh] right-[4vw] z-30 flex items-center gap-3 text-[0.55rem] uppercase tracking-[0.22em] text-white/30">
              <span className="h-1.5 w-1.5 rounded-full bg-beige-300 shadow-[0_0_18px_rgba(219,199,161,.8)]" />
              Live spatial scene
            </div>
          </div>
        </div>

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
