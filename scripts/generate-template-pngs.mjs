#!/usr/bin/env node
/**
 * Convert PDF templates to PNG preview images using pdfjs-dist + canvas
 * Run with: node scripts/generate-template-pngs.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';
// Use legacy build for Node.js environment
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, '..', 'public', 'latex-templates');

const templates = [
  { pdf: 'jake-sample.pdf', png: 'jake-sample.png' },
  { pdf: 'professional-sample.pdf', png: 'professional-sample.png' },
];

async function convertPdfToPng(pdfPath, pngPath) {
  try {
    // Read PDF file
    const pdfData = new Uint8Array(readFileSync(pdfPath));
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfData, useSystemFonts: true });
    const pdfDocument = await loadingTask.promise;
    
    // Get first page
    const page = await pdfDocument.getPage(1);
    
    // Set scale for good quality (2x for retina-like)
    const scale = 2;
    const viewport = page.getViewport({ scale });
    
    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    
    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(pngPath, buffer);
    
    console.log(`✓ Converted: ${pdfPath} -> ${pngPath}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to convert ${pdfPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Converting PDF templates to PNG previews...\n');
  
  for (const template of templates) {
    const pdfPath = join(templatesDir, template.pdf);
    const pngPath = join(templatesDir, template.png);
    
    if (!existsSync(pdfPath)) {
      console.log(`⚠ PDF not found: ${template.pdf}`);
      continue;
    }
    
    if (existsSync(pngPath)) {
      console.log(`⊘ PNG already exists: ${template.png}`);
      continue;
    }
    
    await convertPdfToPng(pdfPath, pngPath);
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
