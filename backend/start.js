import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend/.env before server.js imports modules that read configuration.
dotenv.config({ path: path.join(__dirname, '.env') });
await import('./server.js');
