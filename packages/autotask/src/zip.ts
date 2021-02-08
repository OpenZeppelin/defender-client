import JSZip, { folder } from 'jszip';
import glob from 'glob';
import { promisify } from 'util';
import { readFile } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';

export async function zipSources(sources: { [name: string]: string }): Promise<string> {
  if (!sources['index.js']) throw new Error(`Expected index.js entrypoint in sources`);
  const zip = new JSZip();
  for (const source in sources) {
    zip.file(source, sources[source], { binary: false });
  }

  const zippedCode = await zip.generateAsync({ type: 'nodebuffer' });
  return zippedCode.toString('base64');
}

export async function zipFolder(folderPath: string): Promise<string> {
  if (!existsSync(join(folderPath, 'index.js'))) throw new Error(`Expected index.js entrypoint in folder`);
  const files = await promisify(glob)('**', { cwd: folderPath, nodir: true });
  const zip = new JSZip();
  for (const path of files) {
    const content = await promisify(readFile)(join(folderPath, path));
    zip.file(path, content);
  }

  const zippedCode = await zip.generateAsync({ type: 'nodebuffer' });
  return zippedCode.toString('base64');
}
