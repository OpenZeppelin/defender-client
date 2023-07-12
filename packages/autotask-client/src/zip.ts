import JSZip from 'jszip';
import glob from 'glob';
import { promisify } from 'util';
import { readFile } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';

export async function zipSources(sources: { [name: string]: string }): Promise<string> {
  if (!sources['index.js']) throw new Error(`Expected index.js entrypoint in sources`);
  const zip = new JSZip();
  for (const source in sources) {
    zip.file(source, sources[source]!, { binary: false });
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
    // We hardcode the date so we generate the same zip every time given the same contents
    // This allows us to use the codedigest to decide whether or not to reupload code
    zip.file(path, content, { date: new Date(2020, 1, 1, 0, 0, 0, 0) });
  }

  const zippedCode = await zip.generateAsync({ type: 'nodebuffer' });
  return zippedCode.toString('base64');
}
