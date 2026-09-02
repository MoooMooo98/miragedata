"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#leistungen", label: "Leistungen" },
  { href: "#ueber-uns", label: "Über uns" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#ablauf", label: "Ablauf" },
  { href: "#kontakt", label: "Kontakt" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-colors duration-500 ${
        scrolled
          ? "border-b border-paper/10 bg-ink/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-10">
        <a href="#top" className="font-serif text-xl tracking-wide text-paper">
          MIRAGE<span className="text-beige-300"> DATA</span>
        </a>

        <nav className="hidden items-center gap-10 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative text-sm text-paper/70 transition-colors hover:text-paper"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-beige-300 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <a
            href="#kontakt"
            className="rounded-full border border-beige-300/50 px-5 py-2 text-sm text-paper transition-colors hover:border-beige-300 hover:bg-beige-300 hover:text-ink"
          >
            Projekt starten
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label="Menü öffnen"
          aria-expanded={open}
        >
          <span
            className={`h-px w-6 bg-paper transition-transform ${
              open ? "translate-y-[3.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-px w-6 bg-paper transition-transform ${
              open ? "-translate-y-[3.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-paper/10 bg-ink px-6 pb-6 pt-2 md:hidden">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-paper/5 py-3 text-sm text-paper/80"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#kontakt"
            onClick={() => setOpen(false)}
            className="mt-4 rounded-full bg-beige-300 px-5 py-3 text-center text-sm text-ink"
          >
            Projekt starten
          </a>
        </nav>
      )}
    </header>
  );
}
