import Reveal from "@/components/ui/Reveal";

export default function Contact() {
  return (
    <section id="kontakt" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-paper/10 bg-ink-soft px-8 py-16 sm:px-16 sm:py-24">
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-25 blur-[100px]"
            style={{
              background:
                "radial-gradient(circle, var(--beige-400) 0%, transparent 70%)",
            }}
          />

          <div className="relative grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <span className="text-xs uppercase tracking-[0.35em] text-beige-400">
                Kontakt
              </span>
              <h2 className="mt-4 text-balance font-serif text-4xl font-light leading-[1.1] text-paper sm:text-5xl">
                Lassen Sie uns über Ihr Projekt sprechen.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-paper/60">
                Ob akutes IT-Problem oder neues digitales Vorhaben — schreiben
                Sie uns, wir melden uns kurzfristig mit einer ehrlichen
                Einschätzung.
              </p>

              <dl className="mt-10 space-y-3 text-sm">
                <div className="flex gap-3">
                  <dt className="text-paper/40">Mail</dt>
                  <dd className="text-paper">hallo@miragedata.io</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="text-paper/40">Standort</dt>
                  <dd className="text-paper">Remote &amp; vor Ort</dd>
                </div>
              </dl>
            </Reveal>

            <Reveal delay={150}>
              <form className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-paper/50">
                    Name
                    <input
                      type="text"
                      name="name"
                      className="rounded-lg border border-paper/15 bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-beige-300"
                      placeholder="Ihr Name"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-paper/50">
                    E-Mail
                    <input
                      type="email"
                      name="email"
                      className="rounded-lg border border-paper/15 bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-beige-300"
                      placeholder="ihre@mail.de"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-paper/50">
                  Nachricht
                  <textarea
                    name="message"
                    rows={4}
                    className="resize-none rounded-lg border border-paper/15 bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-beige-300"
                    placeholder="Wie können wir helfen?"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-2 rounded-full bg-paper px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-beige-300"
                >
                  Nachricht senden
                </button>
              </form>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
