// Jest mock for registerStaticFiles.js
// The original uses webpack's require.context which is not available in Jest
// We register the minimum required fonts for PDFKit to function

/* eslint-disable */
const virtualFs = require('pdfkit/js/virtual-fs.js');
const nodePath = require('path');

// Use dynamic require to get Node's real fs (bypassing moduleNameMapper)
let realFs;
try {
  // jest moduleNameMapper maps 'fs' -> virtual-fs, but we need real fs to read disk
  realFs = jest.requireActual('node:fs');
} catch (e) {
  try {
    realFs = require('node:fs');
  } catch (e2) {
    // Cannot access real filesystem
  }
}

if (realFs) {
  // Register static assets
  try {
    const assetsDir = nodePath.resolve(__dirname, '..', '..', '..', '..', 'static-assets');
    if (realFs.existsSync(assetsDir)) {
      const walk = (dir) => {
        realFs.readdirSync(dir).forEach((file) => {
          const fullPath = nodePath.join(dir, file);
          if (realFs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
          } else {
            const relPath = nodePath.relative(assetsDir, fullPath).replace(/\\/g, '/');
            virtualFs.writeFileSync(relPath, realFs.readFileSync(fullPath));
          }
        });
      };
      walk(assetsDir);
    }
  } catch (e) {
    // Silently ignore
  }

  // Register AFM fonts from pdfkit
  try {
    const pdfkitDataDir = nodePath.resolve(__dirname, '..', '..', '..', '..', 'node_modules', 'pdfkit', 'js', 'data');
    if (realFs.existsSync(pdfkitDataDir)) {
      realFs.readdirSync(pdfkitDataDir).forEach((file) => {
        if (/Helvetica.*\.afm$/.test(file)) {
          const fullPath = nodePath.join(pdfkitDataDir, file);
          virtualFs.writeFileSync(`data/${file}`, realFs.readFileSync(fullPath, 'utf8'));
        }
      });
    }
  } catch (e) {
    // Silently ignore
  }
}
