"use client";

import { useCallback, useState } from "react";

import IntroExperience from "@/components/intro/IntroExperience";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import About from "@/components/sections/About";
import Portfolio from "@/components/sections/Portfolio";
import Process from "@/components/sections/Process";
import Contact from "@/components/sections/Contact";

export default function SiteExperience() {
  const [introDone, setIntroDone] = useState(false);
  const handleComplete = useCallback(() => setIntroDone(true), []);

  return (
    <div className="brand-monochrome">
      {!introDone && <IntroExperience onComplete={handleComplete} />}

      <div aria-hidden={!introDone} className={introDone ? "" : "pointer-events-none"}>
        <Header />
        <main>
          <Hero />
          <Services />
          <About />
          <Portfolio />
          <Process />
          <Contact />
        </main>
        <Footer />
      </div>
    </div>
  );
}
