// Simple icon generator - creates placeholder PNG icons
// For production, replace with your actual logo using a tool like:
// - https://www.pwabuilder.com/imageGenerator
// - https://realfavicongenerator.net/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create simple base64 PNG icons (blue square with TP text)
const icon192Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMeSURBVHgB7doxAQAADMOg+TfdyCigBXe88AYBYAYCwAwEgBkIADMQAGYgAMxAAJiBADADAWAGAsAMBIAZCAAzEABmIADMQACYgQAwAwFgBgLADASAGQgAMxAAZiAAzEAAmIEAMAMBYAYCwAwEgBkIADMQAGYgAMxAAJiBADADAWAGAsAMBIAZCAAzEABmIADMQACYgQAwAwFgBgLADASAGQgAMxAAZiAAzEAAmIEAMAMBYAYCwAwEgBkIADMQAGYgAMxAAJiBADADAWAGAsAMBIAZCAAzEABmIADMQACYgQAwAwFgBgLADASAGQgAMxAAZiAAzEAAmIEAMAMBYAYCwAwEgBkIADMQAGYgAMxAAJiBADADAWAGAsAMBIAZCAAzEABmIADMQACYgQAwAwFgBgLADASAGQgAMxAAZiAAzEAAmIEAMAMBYAYCwAwEgBkIADMQAGYgAMxAAJiBADADAWAGAsAMBIAZCAAzEABmIADMQACYgQAwAwFgBgLADASAGQgAMxAAZiAAzEAAmIEAMAMBYAYCwAwEgBkIADMQAGYgAMxAAJiBADADAWAGAsAMBIAZCAAzEABmIADMQACYgQAwAwFgBgLADASAGQgAMxAAZiAAzEAAmIEAMAMBYAYCwAwEgBkIADMQAGYgAMxAAJiBXQEw+wcAAAAASUVORK5CYII=';

const icon512Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMhSURBVHgB7dIxAQAACMOg+Tf9yCigBXe88AYBYAYCwAwEgBkIADMQAGYgAMxAAJiBPQEw+wcAAAAASUVORK5CYII=';

const publicDir = path.join(__dirname, '..', 'public');

// Write icon-192x192.png
fs.writeFileSync(
  path.join(publicDir, 'icon-192x192.png'),
  Buffer.from(icon192Base64, 'base64')
);

// Write icon-512x512.png
fs.writeFileSync(
  path.join(publicDir, 'icon-512x512.png'),
  Buffer.from(icon512Base64, 'base64')
);

console.log('✅ Generated placeholder icons: icon-192x192.png, icon-512x512.png');
console.log('⚠️  Replace these with your actual logo for production!');
console.log('   Recommended: Use https://www.pwabuilder.com/imageGenerator');
