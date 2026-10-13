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
    ['--input-type=module', '-e', `await import(${JSON.stringify(envModuleUrl)});`],
    { cwd: path.join(serverRoot, 'tests'), env: { PATH, SystemRoot, ...variables }, encoding: 'utf8' },
  );
  return { ok: result.status === 0, stderr: result.stderr };
};

describe('environment validation', () => {
  it('accepts a complete production configuration', () => {
    expect(loadEnv(VALID_PRODUCTION_ENV)).toEqual({ ok: true, stderr: '' });
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
});
