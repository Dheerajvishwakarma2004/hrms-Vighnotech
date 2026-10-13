import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** True when the module with the given `import.meta.url` was launched directly with `node <file>`. */
export const isMainModule = (moduleUrl) => {
  const entry = process.argv[1];
  if (!entry) return false;
  return pathToFileURL(path.resolve(entry)).href.toLowerCase() === moduleUrl.toLowerCase();
};
