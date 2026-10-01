import { readFile, writeFile, cp, mkdir } from 'node:fs/promises';
import vm from 'node:vm';

const context = { window: {} };
vm.runInNewContext(await readFile('dist/config.js', 'utf8'), context);
const config = context.window.ZENSATION_CONFIG;
config.supabaseUrl = process.env.SUPABASE_URL || config.supabaseUrl;
config.supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY || config.supabaseAnonKey;
if (!config.supabaseUrl || !config.supabaseAnonKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY before deploying.');
}
if (!config.supabaseUrl.startsWith('https://')) throw new Error('SUPABASE_URL must use HTTPS.');
if (config.supabaseAnonKey.startsWith('sb_secret_')) throw new Error('Use a publishable key, never a secret key.');
if (config.supabaseAnonKey.startsWith('eyJ')) {
  const claims = JSON.parse(Buffer.from(config.supabaseAnonKey.split('.')[1], 'base64url').toString());
  if (claims.role !== 'anon') throw new Error('Only an anon key is allowed in browser configuration.');
}
await mkdir('build', { recursive: true });
await cp('dist', 'build', { recursive: true });
await writeFile('build/config.js', `window.ZENSATION_CONFIG = ${JSON.stringify(config, null, 2)};\n`);
console.log('Static site prepared in build/.');
