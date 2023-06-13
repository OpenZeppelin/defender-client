import JSZip from 'jszip';
import { zipFolder, zipSources } from './zip';
import { resolve } from 'path';

describe('zip', () => {
  describe('zipSources', () => {
    it('zips sources', async function () {
      const zip = await zipSources({
        'index.js': 'exports.handler = () => {};',
        'data.json': '{ "value": 42 }',
        'subfolder/nested.json': '{ "nested": true }',
      });

      await expectZip(zip);
    });

    it('validates index.js', async function () {
      expect(() => zipSources({ 'other.js': 'exports.handler = () => {};' })).rejects.toThrowError(/entrypoint/);
    });
  });

  describe('zipFolder', () => {
    it('zips folder', async function () {
      const zip = await zipFolder(resolve(__dirname, '../fixtures/valid'));
      await expectZip(zip);
    });

    it('validates index.js', async function () {
      expect(() => zipFolder(resolve(__dirname, '../fixtures/invalid'))).rejects.toThrowError(/entrypoint/);
    });
  });
});

async function expectZip(zipContent: string) {
  const zip = new JSZip();
  await zip.loadAsync(Buffer.from(zipContent, 'base64'));
  expect(Object.keys(zip.files).sort()).toEqual(['data.json', 'index.js', 'subfolder/', 'subfolder/nested.json']);
  console.log(await zip.file('index.js')?.async('text'));
  expect(await zip.file('index.js')?.async('text')).toEqual('exports.handler = () => {};');
  expect(await zip.file('data.json')?.async('text')).toEqual('{ "value": 42 }');
  expect(await zip.file('subfolder/nested.json')?.async('text')).toEqual('{ "nested": true }');
}
