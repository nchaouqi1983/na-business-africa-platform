"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3;
  className?: string;
};

const delayClasses: Record<0 | 1 | 2 | 3, string> = {
  0: "",
  1: "delay-100",
  2: "delay-200",
  3: "delay-300",
};

/** Révélation douce au scroll (fondu + translation), désactivée pour prefers-reduced-motion. */
export default function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-[900ms] ease-out motion-reduce:transition-none motion-reduce:transform-none",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7",
        delayClasses[delay],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
