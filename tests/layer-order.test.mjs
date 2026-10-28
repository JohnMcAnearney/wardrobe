import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const result = await build({ entryPoints: ['src/layerControls.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['obsidian'] });
const module = { exports: {} };
const require = createRequire(import.meta.url);
vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require: name => name === 'obsidian' ? { setIcon() {} } : require(name) });
const move = (...args) => Array.from(module.exports.moveLayer(...args));
const rows = ['Hats', 'Tops', 'Socks', 'Shoes'];
test('move first layer after last layer without changing original', () => {
 assert.deepEqual(move(rows, 'Hats', 'Shoes', true), ['Tops', 'Socks', 'Shoes', 'Hats']);
 assert.deepEqual(rows, ['Hats', 'Tops', 'Socks', 'Shoes']);
});
test('move last layer before first layer', () => assert.deepEqual(move(rows, 'Shoes', 'Hats'), ['Shoes', 'Hats', 'Tops', 'Socks']));
test('move a layer one position down or up', () => {
 assert.deepEqual(move(rows, 'Tops', 'Socks', true), ['Hats', 'Socks', 'Tops', 'Shoes']);
 assert.deepEqual(move(rows, 'Socks', 'Tops'), ['Hats', 'Socks', 'Tops', 'Shoes']);
});
test('ignore invalid sources, invalid targets and dropping onto itself', () => {
 assert.deepEqual(move(rows, 'Unknown', 'Tops'), rows);
 assert.deepEqual(move(rows, 'Tops', 'Unknown'), rows);
 assert.deepEqual(move(rows, 'Tops', 'Tops'), rows);
 assert.deepEqual(move([], 'Tops', 'Shoes'), []);
});
