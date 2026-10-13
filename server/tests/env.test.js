import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envModuleUrl = pathToFileURL(path.join(serverRoot, 'src/config/env.js')).href;

const VALID_PRODUCTION_ENV = {
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.net/hrms',
  JWT_SECRET: 'a-private-and-sufficiently-long-secret',
  JWT_EXPIRES_IN: '2h',
};

/**
 * Loads the env module in a child process (it validates once at import time) from a directory
 * without a `.env` file, so only the given variables are seen.
 */
const loadEnv = (variables) => {
  const { PATH, SystemRoot } = process.env;
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `const { env } = await import(${JSON.stringify(envModuleUrl)});
       console.log(JSON.stringify({ url: env.KEEP_ALIVE_BASE_URL, minutes: env.KEEP_ALIVE_INTERVAL_MINUTES }));`,
    ],
    { cwd: path.join(serverRoot, 'tests'), env: { PATH, SystemRoot, ...variables }, encoding: 'utf8' },
  );
  const values = result.status === 0 ? JSON.parse(result.stdout) : undefined;
  return { ok: result.status === 0, stderr: result.stderr, values };
};

describe('environment validation', () => {
  it('accepts a complete production configuration', () => {
    expect(loadEnv(VALID_PRODUCTION_ENV)).toMatchObject({ ok: true, stderr: '' });
  });

  it('requires MONGODB_URI in production', () => {
    const { ok, stderr } = loadEnv({ ...VALID_PRODUCTION_ENV, MONGODB_URI: '' });
    expect(ok).toBe(false);
    expect(stderr).toMatch(/MONGODB_URI is required in production/);
  });

  it('rejects the published example JWT secret in production', () => {
    const { ok, stderr } = loadEnv({
      ...VALID_PRODUCTION_ENV,
      JWT_SECRET: 'replace-with-a-long-random-secret',
    });
    expect(ok).toBe(false);
    expect(stderr).toMatch(/JWT_SECRET must be set to a private random value/);
  });

  it.each(['7200', '2 hrs', 'two hours'])('rejects JWT_EXPIRES_IN=%p without a valid unit', (value) => {
    const { ok, stderr } = loadEnv({ ...VALID_PRODUCTION_ENV, JWT_EXPIRES_IN: value });
    expect(ok).toBe(false);
    expect(stderr).toMatch(/JWT_EXPIRES_IN: must be a number followed by s, m, h or d/);
  });

  it('falls back to a local database outside production', () => {
    expect(loadEnv({ NODE_ENV: 'test' }).ok).toBe(true);
  });

  describe('keep-alive', () => {
    it('uses the public URL Render provides in production, without a trailing slash', () => {
      const { values } = loadEnv({ ...VALID_PRODUCTION_ENV, RENDER_EXTERNAL_URL: 'https://hrms.onrender.com/' });
      expect(values).toEqual({ url: 'https://hrms.onrender.com', minutes: 10 });
    });

    it('prefers KEEP_ALIVE_URL and honours the interval', () => {
      const { values } = loadEnv({
        ...VALID_PRODUCTION_ENV,
        RENDER_EXTERNAL_URL: 'https://hrms.onrender.com',
        KEEP_ALIVE_URL: 'https://custom.example.com',
        KEEP_ALIVE_INTERVAL_MINUTES: '5',
      });
      expect(values).toEqual({ url: 'https://custom.example.com', minutes: 5 });
    });

    it('is disabled outside production even when a URL is present', () => {
      const { values } = loadEnv({ NODE_ENV: 'development', RENDER_EXTERNAL_URL: 'https://hrms.onrender.com' });
      expect(values.url).toBeUndefined();
    });

    it('is disabled in production when no public URL is known', () => {
      expect(loadEnv(VALID_PRODUCTION_ENV).values.url).toBeUndefined();
    });

    it.each(['0', '15', 'often'])('rejects KEEP_ALIVE_INTERVAL_MINUTES=%p', (value) => {
      const { ok, stderr } = loadEnv({ ...VALID_PRODUCTION_ENV, KEEP_ALIVE_INTERVAL_MINUTES: value });
      expect(ok).toBe(false);
      expect(stderr).toMatch(/KEEP_ALIVE_INTERVAL_MINUTES/);
    });
  });
});
