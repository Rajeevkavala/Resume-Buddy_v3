/**
 * Bundle Analyzer Configuration
 * Analyze bundle size and composition
 * Run with: ANALYZE=true npm run build
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

module.exports = withBundleAnalyzer;
