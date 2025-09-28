/**
 * Script to create disabled versions of the extension icons
 *
 * This script uses the Sharp library to create grayscale versions of the icons
 * with reduced opacity to indicate that the extension is disabled.
 *
 * Usage: node scripts/create-disabled-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Icon sizes to process
const ICON_SIZES = [16, 48, 128];
const ICONS_DIR = path.join(__dirname, '../icons');

/**
 * Create a disabled version of an icon
 * @param {string} iconPath - Path to the original icon
 * @param {string} outputPath - Path to save the disabled icon
 */
async function createDisabledIcon(iconPath, outputPath) {
  try {
    console.log(`Processing: ${iconPath}`);

    // Create a grayscale version with reduced opacity (70%)
    await sharp(iconPath)
      .grayscale()
      // Apply 70% opacity (0.7 * 255 = 178)
      .ensureAlpha(0.7)
      .toFile(outputPath);

    console.log(`Created: ${outputPath}`);
  } catch (error) {
    console.error(`Error creating disabled icon for ${iconPath}:`, error);
  }
}

/**
 * Main function to create all disabled icons
 */
async function main() {
  console.log('Creating disabled icons...');

  // Create the icons directory if it doesn't exist
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  // Process each icon size
  for (const size of ICON_SIZES) {
    const iconPath = path.join(ICONS_DIR, `icon${size}.png`);
    const disabledIconPath = path.join(ICONS_DIR, `icon${size}-disabled.png`);

    // Check if the original icon exists
    if (fs.existsSync(iconPath)) {
      await createDisabledIcon(iconPath, disabledIconPath);
    } else {
      console.warn(`Original icon not found: ${iconPath}`);
    }
  }

  console.log('Done creating disabled icons.');
}

// Run the script
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
