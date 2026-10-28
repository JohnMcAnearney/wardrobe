import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import vm from 'node:vm';
class TFolder {}
const result = await build({ entryPoints: ['src/folders.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['obsidian'] });
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require: () => ({ TFolder, normalizePath: value => value.replace(/\/+/g, '/') }) });
const { outfitFolder, ensureOutfitFolder } = module.exports;
test('folder paths support root and nested destinations and reject traversal', () => {
 assert.equal(outfitFolder(''), ''); assert.equal(outfitFolder('/'), '');
 assert.equal(outfitFolder(' Looks/Summer/ '), 'Looks/Summer');
 for(const value of ['../outside', 'Looks/../Other', '/absolute', 'C:\\folder', 'bad:name']) assert.throws(() => outfitFolder(value));
});
test('create only missing nested folders and reject files in the path', async () => {
 const files = new Map(); const created = [];
 const vault = { getAbstractFileByPath: path => files.get(path), createFolder: async path => { files.set(path, new TFolder()); created.push(path); } };
 await ensureOutfitFolder(vault, 'Looks/Summer');
 assert.deepEqual(created, ['Looks', 'Looks/Summer']);
 await ensureOutfitFolder(vault, 'Looks/Summer'); assert.equal(created.length, 2);
 files.set('File', {});
 await assert.rejects(ensureOutfitFolder(vault, 'File/Outfits'));
});
