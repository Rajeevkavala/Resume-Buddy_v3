"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  className?: string;
  delay?: number;
  suffix?: string;
  prefix?: string;
  decimalPlaces?: number;
}

/**
 * NumberTicker - Animated number counter component
 * Inspired by Magic UI, provides smooth counting animation
 */
export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  suffix = "",
  prefix = "",
  decimalPlaces = 0,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [motionValue, isInView, delay, value, direction]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        const formattedNumber = decimalPlaces > 0
          ? latest.toFixed(decimalPlaces)
          : Intl.NumberFormat("en-US").format(Math.round(latest));
        ref.current.textContent = prefix + formattedNumber + suffix;
      }
    });
    return () => unsubscribe();
  }, [springValue, suffix, prefix, decimalPlaces]);

  return (
    <span
      className={cn(
        "inline-block tabular-nums text-foreground tracking-tight",
        className
      )}
      ref={ref}
    >
      {prefix}0{suffix}
    </span>
  );
}

interface StatCardProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  className?: string;
  variant?: "default" | "accent" | "dark" | "outline";
  icon?: React.ReactNode;
  delay?: number;
}

/**
 * StatCard - Styled stat display with NumberTicker
 */
export function StatCard({
  value,
  suffix = "",
  prefix = "",
  label,
  className,
  variant = "default",
  icon,
  delay = 0,
}: StatCardProps) {
  const variantStyles = {
    default: "bg-card border",
    accent: "bg-accent text-accent-foreground",
    dark: "bg-foreground text-background",
    outline: "bg-transparent border-2",
  };

  return (
    <div
      className={cn(
        "p-6 md:p-8 rounded-3xl flex flex-col justify-between",
        variantStyles[variant],
        className
      )}
    >
      <NumberTicker
        value={value}
        suffix={suffix}
        prefix={prefix}
        delay={delay}
        className={cn(
          "text-4xl md:text-5xl font-accent font-bold",
          variant === "accent" && "text-accent-foreground",
          variant === "dark" && "text-background"
        )}
      />
      <div className="mt-2 flex items-center justify-between">
        <p
          className={cn(
            "text-sm font-medium",
            variant === "default" && "text-muted-foreground",
            variant === "accent" && "opacity-90",
            variant === "dark" && "opacity-80"
          )}
        >
          {label}
        </p>
        {icon && <div className="opacity-70">{icon}</div>}
      </div>
    </div>
  );
}
