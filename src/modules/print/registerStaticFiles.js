// ref https://github.com/foliojs/pdfkit/blob/65670353f9a3f4ceea2ac0f37cd92f476bfd11ae/examples/webpack/src/registerStaticFiles.js

// the fs here is not node fs but the provided virtual one
import fs from 'fs';
import forEach from 'lodash/forEach';
// the content file is returned as is (webpack is configured to load *.afm files as asset/source)

function registerBinaryFiles(ctx) {
  forEach(ctx.keys(), key => {
    // extracts "./" from beginning of the key
    fs.writeFileSync(key.substring(2), ctx(key));
  });
}

function registerAFMFonts(ctx) {
  forEach(ctx.keys(), key => {
    const match = key.match(/([^/]*\.afm$)/);
    if (match) {
      // afm files must be stored on data path
      fs.writeFileSync(`data/${match[0]}`, ctx(key));
    }
  });
}

// register all files found in assets folder (relative to src)
registerBinaryFiles(require.context('./static-assets', true));

// register AFM fonts distributed with pdfkit
// is good practice to register only required fonts to avoid the bundle size increase too much
registerAFMFonts(require.context('pdfkit/js/data', false, /Helvetica.*\.afm$/));
