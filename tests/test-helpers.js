import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, afterEach } from 'vitest';

export function setupTmpDir() {
  const originalCwd = process.cwd();
  let tmp;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fct-unit-'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  return {
    tmpDir() {
      return tmp;
    },
    addonPath() {
      return path.join(tmp, 'node_modules', 'my-components', 'addon');
    },
    write(rel, content = '') {
      const abs = path.join(tmp, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content);
    },
    writeAddon(rel, content = '') {
      const abs = path.join(tmp, 'node_modules', 'my-components', 'addon', rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content);
    },
  };
}
