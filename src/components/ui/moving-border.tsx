"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MovingBorderProps {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  className?: string;
  containerClassName?: string;
  as?: React.ElementType;
  borderRadius?: string;
}

export const MovingBorder = ({
  children,
  duration = 2000,
  rx = "30",
  ry = "30",
  className,
  containerClassName,
  as: Component = "div",
  borderRadius = "1.5rem",
  ...otherProps
}: MovingBorderProps) => {
  return (
    <Component
      className={cn(
        "relative h-fit w-fit overflow-hidden bg-transparent p-[1px]",
        containerClassName
      )}
      style={{ borderRadius }}
      {...otherProps}
    >
      <motion.div
        className="absolute inset-0 rounded-[inherit] opacity-60"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
            conic-gradient(from 0deg at 50% 50%, 
              #00d4ff, #090979, #020024, #00d4ff)
          `,
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: duration / 1000,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div
        className={cn(
          "relative z-10 h-full w-full rounded-[inherit] bg-background",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
};