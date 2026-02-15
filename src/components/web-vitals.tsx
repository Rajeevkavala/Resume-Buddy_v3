'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

/**
 * Web Vitals Reporter Component
 * Tracks Core Web Vitals and sends them to analytics
 * Metrics tracked: CLS, FID, FCP, LCP, TTFB, INP
 */

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }

    // Send to analytics in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Google Analytics example
      if (window.gtag) {
        window.gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        });
      }

      // You can also send to other analytics platforms
      // Example: Vercel Analytics, Plausible, etc.
    }
  });

  return null;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
