"use client";

import { useEffect, useRef, useState } from "react";

// The exact second, inside intro-monaco.mp4, where the two source clips
// were cut together (the whip-pan reveal). The 0→100 loader is driven by
// the video's own playback time so "100%" lands exactly on that join.
const CUT_SECONDS = 9.375;
const FALLBACK_VIDEO_MS = 13125; // used until the real <video> duration is known
const TEXT_LEAD_MS = 1400; // welcome text appears this long before the video ends
const EXIT_MS = 1100; // final fade to the real site
const STALL_TIMEOUT_MS = CUT_SECONDS * 1000 + 4000; // safety net if playback stalls

type Phase = "loading" | "clear" | "exit" | "done";

export default function IntroExperience({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [videoMs, setVideoMs] = useState(FALLBACK_VIDEO_MS);
  const videoRef = useRef<HTMLVideoElement>(null);
  const phaseRef = useRef<Phase>("loading");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Lock scroll while the intro is up.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Start the background video immediately, blurred, muted, and read its
  // real duration so the "clear" phase runs exactly to the video's end.
  useEffect(() => {
    const video = videoRef.current;
    video?.play().catch(() => {});
    const onMeta = () => {
      if (video && isFinite(video.duration) && video.duration > 0) {
        setVideoMs(video.duration * 1000);
      }
    };
    const syncFromVideo = () => {
      if (!video || phaseRef.current !== "loading") return;
      const pct = Math.min(100, (video.currentTime / CUT_SECONDS) * 100);
      setProgress(Math.round(pct));
      if (video.currentTime >= CUT_SECONDS || video.ended) {
        setProgress(100);
        setPhase("clear");
      }
    };
    video?.addEventListener("loadedmetadata", onMeta);
    video?.addEventListener("timeupdate", syncFromVideo);
    video?.addEventListener("ended", syncFromVideo);
    return () => {
      video?.removeEventListener("loadedmetadata", onMeta);
      video?.removeEventListener("timeupdate", syncFromVideo);
      video?.removeEventListener("ended", syncFromVideo);
    };
  }, []);

  // Drive the 0 → 100 counter from the video's own currentTime, so the
  // loader reaches exactly 100% the moment playback hits the cut point —
  // then hand off to "clear" without touching currentTime, so the video
  // keeps rolling straight through the join.
  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const video = videoRef.current;
      if (video) {
        const pct = Math.min(100, (video.currentTime / CUT_SECONDS) * 100);
        setProgress(Math.round(pct));
        if (video.currentTime >= CUT_SECONDS) {
          setPhase("clear");
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Safety net: if the video stalls/can't autoplay, don't leave the
    // visitor stuck behind the loader forever.
    const stallTimer = setTimeout(() => {
      if (phaseRef.current === "loading") {
        setProgress(100);
        setPhase("clear");
      }
    }, STALL_TIMEOUT_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(stallTimer);
    };
  }, []);

  // Loading just finished exactly at the cut: keep the video rolling
  // (no restart) and time the welcome text + handoff off what's left.
  useEffect(() => {
    if (phase !== "clear") return;
    videoRef.current?.play().catch(() => {});

    const remaining = Math.max(800, videoMs - CUT_SECONDS * 1000);
    const textTimer = setTimeout(
      () => setShowWelcome(true),
      Math.max(0, remaining - TEXT_LEAD_MS)
    );
    const exitTimer = setTimeout(() => setPhase("exit"), remaining);
    return () => {
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
    };
  }, [phase, videoMs]);

  useEffect(() => {
    if (phase !== "exit") return;
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, EXIT_MS);
    return () => clearTimeout(doneTimer);
  }, [phase, onComplete]);

  if (phase === "done") return null;

  const isClearing = phase === "clear" || phase === "exit";
  const isExiting = phase === "exit";

  return (
    <div
      aria-hidden={phase === "exit"}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-ink transition-opacity duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ opacity: isExiting ? 0 : 1 }}
    >
      <div
        className="absolute inset-0 transition-[filter] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          filter: isClearing ? "blur(0px)" : "blur(1.5px)",
          transitionDuration: "900ms",
        }}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            opacity: isClearing ? 1 : 0.7,
            transform: isClearing ? "scale(1)" : "scale(1.1)",
          }}
          src="/videos/intro-monaco.mp4"
          muted
          playsInline
          autoPlay
          preload="auto"
        />
        <div
          className="absolute inset-0 bg-ink transition-opacity duration-[900ms]"
          style={{ opacity: isClearing ? 0.22 : 0.55 }}
        />
      </div>

      <div
        className="absolute inset-0 bg-gradient-to-b from-ink/45 via-transparent to-ink/80 transition-opacity duration-[900ms]"
        style={{ opacity: isClearing ? 0.6 : 1 }}
      />

      {/* Loading readout */}
      <div
        className="relative flex flex-col items-center gap-6 transition-opacity duration-500"
        style={{ opacity: phase === "loading" ? 1 : 0 }}
      >
        <span className="font-serif text-7xl font-light tabular-nums tracking-tight text-paper sm:text-8xl">
          {progress}
          <span className="text-3xl text-beige-300 sm:text-4xl">%</span>
        </span>
        <div className="h-px w-40 overflow-hidden bg-paper/15 sm:w-56">
          <div
            className="h-full bg-beige-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[0.65rem] uppercase tracking-[0.35em] text-paper/40">
          Mirage Data wird geladen
        </span>
      </div>

      {/* Welcome text — off-center, lower right, not the dead middle */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[14%] flex justify-end px-6 sm:bottom-[16%] sm:px-14 lg:px-24">
        {showWelcome && (
          <h1 className="animate-fade-up-premium max-w-xl text-right font-serif text-3xl font-light italic tracking-tight text-paper sm:text-5xl md:text-6xl">
            Willkommen im{" "}
            <span className="not-italic text-beige-300">IT Void</span>
          </h1>
        )}
      </div>
    </div>
  );
}
