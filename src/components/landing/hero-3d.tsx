"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import { WebGLBoundary } from "./webgl-boundary";
import { HeroFallback } from "./hero-fallback";

const HeroScene = dynamic(() => import("./hero-scene").then((m) => m.HeroScene), {
  ssr: false,
});

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function HeroScene3D({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const [lost, setLost] = useState(false);
  if (lost) return <HeroFallback />;
  return <HeroScene onContextLost={() => setLost(true)} scrollProgress={scrollProgress} />;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function Hero3D() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 120]);
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 60]);

  const scrollProgress = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollProgress.current = v;
  });

  const [canUse3D, setCanUse3D] = useState<boolean | null>(null);
  useEffect(() => {
    setCanUse3D(supportsWebGL());
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[100svh] min-h-[720px] w-full overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_38%,rgba(249,115,22,0.10),transparent)]" />

      <motion.div className="absolute inset-0" style={{ y: sceneY, opacity: sceneOpacity }}>
        {canUse3D === false ? (
          <HeroFallback />
        ) : canUse3D ? (
          <WebGLBoundary fallback={<HeroFallback />}>
            <HeroScene3D scrollProgress={scrollProgress} />
          </WebGLBoundary>
        ) : null}
      </motion.div>

      <motion.div
        style={{ y: textY }}
        className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.1}
          className="pointer-events-auto mb-6 text-xs font-bold tracking-[0.3em] text-orange-600"
        >
          LEARNING SUPPORT PLATFORM
        </motion.p>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.25}
          className="pointer-events-auto max-w-4xl font-heading text-5xl font-bold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl md:text-7xl"
        >
          Learning should
          <br />
          <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
            adapt to the learner.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.4}
          className="pointer-events-auto mt-7 max-w-xl text-balance text-lg text-stone-600"
        >
          One connected experience for students, teachers, parents and schools.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.55}
          className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-orange-600 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]"
          >
            Explore the platform
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <a
            href="#problem"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-7 py-3.5 text-sm font-medium text-stone-700 backdrop-blur-sm transition-all duration-300 hover:border-stone-400 hover:text-stone-900"
          >
            <PlayCircle className="h-4 w-4" />
            See how it works
          </a>
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.7}
          className="pointer-events-auto mt-8 text-xs font-semibold tracking-[0.2em] text-stone-400"
        >
          ACCESSIBLE&nbsp;&nbsp;·&nbsp;&nbsp;PERSONALIZED&nbsp;&nbsp;·&nbsp;&nbsp;CONNECTED
        </motion.p>
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
