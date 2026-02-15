/**
 * Performance monitoring utility
 * Tracks Core Web Vitals and custom metrics
 */

export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  tti?: number; // Time to Interactive
}

let metrics: PerformanceMetrics = {};

/**
 * Report Core Web Vitals to analytics
 */
export function reportWebVitals(metric: any) {
  const { name, value, id } = metric;
  
  const metricName = name.toLowerCase() as keyof PerformanceMetrics;
  metrics[metricName] = value;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}:`, value);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // You can send to Google Analytics, Vercel Analytics, etc.
    if (window.gtag) {
      window.gtag('event', name, {
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_category: 'Web Vitals',
        event_label: id,
        non_interaction: true,
      });
    }
  }
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics };
}

/**
 * Measure custom performance mark
 */
export function measurePerformance(markName: string) {
  if (typeof window === 'undefined' || !window.performance) return;
  
  performance.mark(markName);
}

/**
 * Measure time between two marks
 */
export function measureTimeBetween(startMark: string, endMark: string, measureName: string) {
  if (typeof window === 'undefined' || !window.performance) return;
  
  try {
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${measureName}:`, measure.duration, 'ms');
    }
    
    return measure.duration;
  } catch (error) {
    console.warn('Performance measurement failed:', error);
  }
}

/**
 * Clear performance marks and measures
 */
export function clearPerformanceMarks() {
  if (typeof window === 'undefined' || !window.performance) return;
  
  performance.clearMarks();
  performance.clearMeasures();
}

/**
 * Log page load performance
 */
export function logPageLoadPerformance() {
  if (typeof window === 'undefined' || !window.performance) return;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        const metrics = {
          'DNS Lookup': perfData.domainLookupEnd - perfData.domainLookupStart,
          'TCP Connection': perfData.connectEnd - perfData.connectStart,
          'Request Time': perfData.responseStart - perfData.requestStart,
          'Response Time': perfData.responseEnd - perfData.responseStart,
          'DOM Processing': perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          'Load Complete': perfData.loadEventEnd - perfData.loadEventStart,
          'Total Load Time': perfData.loadEventEnd - perfData.fetchStart,
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.table(metrics);
        }
      }
    }, 0);
  });
}

/**
 * Monitor long tasks (> 50ms)
 */
export function monitorLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Performance] Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    // PerformanceObserver not supported or longtask not available
  }
}

/**
 * Prefetch resources for better navigation
 */
export function prefetchResources(urls: string[]) {
  if (typeof window === 'undefined') return;
  
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to external domains
 */
export function preconnectDomains(domains: string[]) {
  if (typeof window === 'undefined') return;
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  logPageLoadPerformance();
  monitorLongTasks();
  
  // Preconnect to common external domains
  preconnectDomains([
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ]);
}
