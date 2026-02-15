"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
    "M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859",
    "M-359 -213C-359 -213 -291 192 173 319C637 446 705 851 705 851",
    "M-352 -221C-352 -221 -284 184 180 311C644 438 712 843 712 843",
    "M-345 -229C-345 -229 -277 176 187 303C651 430 719 835 719 835",
  ];

  return (
    <div
      className={cn(
        "absolute inset-0 h-full w-full overflow-hidden",
        className
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path, index) => (
          <motion.path
            key={`path-${index}`}
            d={path}
            stroke={`url(#linearGradient-${index})`}
            strokeWidth="1"
            strokeOpacity="0.4"
            fill="none"
            initial={{
              pathLength: 0,
            }}
            animate={{
              pathLength: 1,
            }}
            transition={{
              duration: 5,
              ease: "easeInOut",
              delay: index * 0.5,
              repeat: Infinity,
              repeatType: "reverse",
              repeatDelay: 2,
            }}
          />
        ))}
        <defs>
          {paths.map((_, index) => (
            <linearGradient
              id={`linearGradient-${index}`}
              key={`gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#18CCFC"
                stopOpacity="0"
              ></stop>
              <stop
                offset="10%"
                stopColor="#18CCFC"
                stopOpacity="1"
              ></stop>
              <stop
                offset="50%"
                stopColor="#6344F5"
                stopOpacity="1"
              ></stop>
              <stop
                offset="90%"
                stopColor="#AE48FF"
                stopOpacity="1"
              ></stop>
              <stop
                offset="100%"
                stopColor="#AE48FF"
                stopOpacity="0"
              ></stop>
            </linearGradient>
          ))}
        </defs>
      </svg>
    </div>
  );
};