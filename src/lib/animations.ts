/**
 * Animation utilities for Framer Motion
 * Modern, authentic design patterns - no overused AI-startup aesthetics
 */

import type { Variants, Transition, Easing } from 'framer-motion';

// Smooth easing curve for natural motion (typed as Easing)
const smoothEasing: Easing = [0.25, 0.4, 0.25, 1];

// Entrance animations
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: smoothEasing 
    }
  }
};

export const fadeIn: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.4, 
      ease: smoothEasing 
    }
  }
};

export const fadeInDown: Variants = {
  hidden: { 
    opacity: 0, 
    y: -20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: smoothEasing 
    }
  }
};

export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -30 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.5, 
      ease: smoothEasing 
    }
  }
};

export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 30 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.5, 
      ease: smoothEasing 
    }
  }
};

// Container for staggered children
export const staggerContainer: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerContainerFast: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

export const staggerContainerSlow: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

// Scale animations
export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9 
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: smoothEasing 
    }
  }
};

export const scaleInBounce: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  }
};

// Hover variants for interactive elements
export const cardHover: Variants = {
  rest: { 
    scale: 1,
    y: 0,
    boxShadow: "0 0 0 rgba(0,0,0,0)"
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    transition: { 
      duration: 0.2, 
      ease: "easeOut" 
    }
  }
};

export const cardHoverSubtle: Variants = {
  rest: { 
    scale: 1,
    y: 0
  },
  hover: {
    scale: 1.01,
    y: -2,
    transition: { 
      duration: 0.2, 
      ease: "easeOut" 
    }
  }
};

export const buttonHover: Variants = {
  rest: { 
    scale: 1 
  },
  hover: { 
    scale: 1.05,
    transition: { 
      duration: 0.15, 
      ease: "easeOut" 
    }
  },
  tap: { 
    scale: 0.98,
    transition: { 
      duration: 0.1 
    }
  }
};

export const iconHover: Variants = {
  rest: { 
    scale: 1,
    rotate: 0
  },
  hover: { 
    scale: 1.1,
    rotate: 5,
    transition: { 
      duration: 0.2, 
      ease: "easeOut" 
    }
  }
};

// Text reveal animations
export const textReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(10px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: smoothEasing
    }
  }
};

// Slide animations
export const slideUp: Variants = {
  hidden: { 
    y: "100%" 
  },
  visible: { 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: smoothEasing 
    }
  },
  exit: { 
    y: "100%",
    transition: { 
      duration: 0.3, 
      ease: smoothEasing 
    }
  }
};

export const slideDown: Variants = {
  hidden: { 
    y: "-100%" 
  },
  visible: { 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: smoothEasing 
    }
  }
};

// Viewport settings for scroll-triggered animations
export const viewportOnce = { 
  once: true, 
  margin: "-100px" 
};

export const viewportAlways = { 
  once: false, 
  margin: "-50px" 
};

// Custom transitions
export const springTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30
};

export const smoothTransition: Transition = {
  duration: 0.4,
  ease: smoothEasing
};

// Drawer/Modal animations
export const drawerSlideRight: Variants = {
  hidden: { 
    x: "100%",
    opacity: 0
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    x: "100%",
    opacity: 0,
    transition: { 
      duration: 0.2 
    }
  }
};

export const backdropFade: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.2 
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.2 
    }
  }
};

// Pulse animation for attention
export const pulse: Variants = {
  rest: {
    scale: 1
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Loading/Skeleton animation
export const shimmer: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear"
    }
  }
};
