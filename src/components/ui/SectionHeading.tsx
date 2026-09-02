import Reveal from "./Reveal";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
}) {
  const isCenter = align === "center";
  return (
    <Reveal className={isCenter ? "flex flex-col items-center text-center" : ""}>
      <span className="text-xs uppercase tracking-[0.35em] text-beige-400">
        {eyebrow}
      </span>
      <h2
        className={`mt-4 font-serif text-4xl font-light leading-[1.1] text-paper sm:text-5xl md:text-6xl ${
          isCenter ? "max-w-3xl" : "max-w-2xl"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-5 max-w-xl text-base leading-relaxed text-paper/60 sm:text-lg ${
            isCenter ? "mx-auto" : ""
          }`}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
