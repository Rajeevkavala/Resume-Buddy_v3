/**
 * Performance Budget Configuration
 * Define performance thresholds for the application
 * Used by bundlesize or similar tools to prevent performance regressions
 */

module.exports = {
  // Bundle size budgets
  files: [
    {
      path: '.next/static/chunks/*.js',
      maxSize: '200kb',
      compression: 'gzip',
    },
    {
      path: '.next/static/css/*.css',
      maxSize: '50kb',
      compression: 'gzip',
    },
  ],
  
  // Performance metrics thresholds
  budgets: [
    {
      resourceSizes: [
        {
          resourceType: 'script',
          budget: 500, // KB
        },
        {
          resourceType: 'stylesheet',
          budget: 100, // KB
        },
        {
          resourceType: 'image',
          budget: 200, // KB per image
        },
        {
          resourceType: 'total',
          budget: 1000, // KB total page weight
        },
      ],
      metrics: [
        {
          metric: 'first-contentful-paint',
          budget: 2000, // ms
        },
        {
          metric: 'largest-contentful-paint',
          budget: 2500, // ms
        },
        {
          metric: 'cumulative-layout-shift',
          budget: 0.1, // score
        },
        {
          metric: 'total-blocking-time',
          budget: 300, // ms
        },
        {
          metric: 'speed-index',
          budget: 3000, // ms
        },
      ],
    },
  ],
};
