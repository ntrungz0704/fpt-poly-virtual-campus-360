"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

const DESKTOP_MEDIA = "(min-width: 1024px)";
const REDUCED_MOTION_MEDIA = "(prefers-reduced-motion: reduce)";

function subscribeDesktopMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const desktopMql = window.matchMedia(DESKTOP_MEDIA);
  const reducedMql = window.matchMedia(REDUCED_MOTION_MEDIA);
  desktopMql.addEventListener("change", callback);
  reducedMql.addEventListener("change", callback);
  return () => {
    desktopMql.removeEventListener("change", callback);
    reducedMql.removeEventListener("change", callback);
  };
}

/**
 * Returns `true` strictly on Desktop (>= 1024px) when user does not prefer reduced motion.
 * Always returns `false` on SSR, mobile, and tablet so <1024px renders static with zero animations.
 */
export function useDesktopMotionEnabled(): boolean {
  return useSyncExternalStore(
    subscribeDesktopMotion,
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(DESKTOP_MEDIA).matches &&
      !window.matchMedia(REDUCED_MOTION_MEDIA).matches,
    () => false
  );
}

/* -------------------------------------------------------------------------- */
/* 1. BlurText (React Bits inspired word-by-word blur-to-focus text reveal)   */
/* -------------------------------------------------------------------------- */
interface BlurTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  id?: string;
  className?: string;
  delay?: number;
  direction?: "top" | "bottom";
}

export function BlurText({
  text,
  as: Tag = "h2",
  id,
  className,
  delay = 45,
  direction = "bottom",
}: BlurTextProps) {
  const desktopEnabled = useDesktopMotionEnabled();
  const words = text.split(" ");
  const yOffset = direction === "top" ? -14 : 14;

  if (!desktopEnabled) {
    return (
      <Tag id={id} className={className}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag id={id} className={className}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: yOffset, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: "some" }}
          transition={{
            duration: 0.45,
            delay: (index * delay) / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block will-change-transform"
        >
          {word}
          {index < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. AnimatedContent (React Bits scroll-triggered slide, scale & spring)     */
/* -------------------------------------------------------------------------- */
interface AnimatedContentProps {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  direction?: "vertical" | "horizontal";
  reverse?: boolean;
  scale?: number;
  duration?: number;
  delay?: number;
  initialOpacity?: number;
  blur?: boolean;
}

export function AnimatedContent({
  children,
  className,
  distance = 28,
  direction = "vertical",
  reverse = false,
  scale = 0.98,
  duration = 0.58,
  delay = 0,
  initialOpacity = 0,
  blur = false,
}: AnimatedContentProps) {
  const desktopEnabled = useDesktopMotionEnabled();

  if (!desktopEnabled) {
    return <div className={className}>{children}</div>;
  }

  const signedDist = reverse ? -distance : distance;
  const initialTransform =
    direction === "horizontal"
      ? { x: signedDist, y: 0 }
      : { x: 0, y: signedDist };

  return (
    <motion.div
      initial={{
        opacity: initialOpacity,
        scale,
        ...initialTransform,
        ...(blur ? { filter: "blur(6px)" } : {}),
      }}
      whileInView={{
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        ...(blur ? { filter: "blur(0px)" } : {}),
      }}
      viewport={{ once: true, amount: "some" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. FadeContent (React Bits smooth blur/mist fade on scroll)                */
/* -------------------------------------------------------------------------- */
interface FadeContentProps {
  children: React.ReactNode;
  className?: string;
  blur?: boolean;
  duration?: number;
  delay?: number;
}

export function FadeContent({
  children,
  className,
  blur = true,
  duration = 0.6,
  delay = 0,
}: FadeContentProps) {
  const desktopEnabled = useDesktopMotionEnabled();

  if (!desktopEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...(blur ? { filter: "blur(8px)" } : {}),
      }}
      whileInView={{
        opacity: 1,
        ...(blur ? { filter: "blur(0px)" } : {}),
      }}
      viewport={{ once: true, amount: "some" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. SpotlightCard (React Bits interactive pointer radial glow on Desktop)   */
/* -------------------------------------------------------------------------- */
interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(243, 111, 33, 0.14)",
}: SpotlightCardProps) {
  const desktopEnabled = useDesktopMotionEnabled();
  const mouseX = useMotionValue(-320);
  const mouseY = useMotionValue(-320);
  const spotlightBg = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 75%)`;

  if (!desktopEnabled) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-320);
    mouseY.set(-320);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("group/spotlight relative overflow-hidden", className)}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100 z-10"
        style={{ background: spotlightBg }}
      />
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. CountUp (React Bits animated counter when entering viewport on Desktop) */
/* -------------------------------------------------------------------------- */
interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  delay = 0,
  suffix = "",
  prefix = "",
  className,
}: CountUpProps) {
  const desktopEnabled = useDesktopMotionEnabled();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: "some" });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!desktopEnabled) {
      el.textContent = `${prefix}${to}${suffix}`;
      return;
    }
    if (!inView) return;

    const controls = animate(from, to, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.round(latest)}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [desktopEnabled, inView, from, to, duration, delay, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {`${prefix}${to}${suffix}`}
    </span>
  );
}
