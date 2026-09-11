#!/usr/bin/env node
/**
 * Packages dist/ into a versioned ZIP for the Chrome Web Store.
 *
 * The store expects manifest.json at the archive root, so the contents of
 * dist/ are zipped, not the dist/ directory itself.
 *
 * Run `npm run build` first, or use `npm run package` which does both.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const RELEASES = path.join(ROOT, 'releases');

// Junk that must not reach the store listing.
const EXCLUDED = ['*.DS_Store', '__MACOSX/*', '*.map'];

const readVersion = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')).version;

const assertZipAvailable = () => {
  try {
    execFileSync('zip', ['-v'], { stdio: 'ignore' });
  } catch (error) {
    throw new Error(
      `The "zip" command is required to package the extension but is not available on PATH (${error.message}). ` +
        'Install it (macOS ships it by default; on Debian/Ubuntu run "apt install zip") and re-run "npm run package".',
    );
  }
};

const main = () => {
  const manifestPath = path.join(DIST, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`No build found at ${manifestPath}. Run "npm run build" before packaging.`);
  }

  // A version mismatch here means the bundle in dist/ predates the version bump,
  // which would upload the wrong version number to the store.
  const packageVersion = readVersion('package.json');
  const manifestVersion = readVersion('manifest.json');
  const builtVersion = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).version;

  if (packageVersion !== manifestVersion) {
    throw new Error(
      `Version mismatch: package.json is ${packageVersion} but manifest.json is ${manifestVersion}. ` +
        'Both must match before packaging a release.',
    );
  }

  if (builtVersion !== manifestVersion) {
    throw new Error(
      `Version mismatch: dist/manifest.json is ${builtVersion} but manifest.json is ${manifestVersion}. ` +
        'The build is stale, re-run "npm run build".',
    );
  }

  assertZipAvailable();

  fs.mkdirSync(RELEASES, { recursive: true });
  const zipPath = path.join(RELEASES, `send-pr-to-slack-v${manifestVersion}.zip`);
  fs.rmSync(zipPath, { force: true });

  execFileSync('zip', ['-r', '-q', '-X', zipPath, '.', '-x', ...EXCLUDED], { cwd: DIST });

  const sizeKb = (fs.statSync(zipPath).size / 1024).toFixed(1);
  console.log(`Packaged v${manifestVersion} -> ${path.relative(ROOT, zipPath)} (${sizeKb} KiB)`);
};

main();
