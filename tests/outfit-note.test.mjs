import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { parse as load, stringify as dump } from 'yaml';
import vm from 'node:vm';
const result = await build({ entryPoints: ['src/outfitNote.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['obsidian'] });
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require: () => ({ parseYaml: load, stringifyYaml: dump }) });
const { buildOutfitNote, DEFAULT_OUTFIT_TEMPLATE } = module.exports;
const properties = content => load(content.match(/^---\n([\s\S]*?)\n---/)[1]);
test('default preserves supplied properties, fills dates, adds images without bullets or title', () => {
 const result = buildOutfitNote(DEFAULT_OUTFIT_TEMPLATE, '![[Assets/top.png]]\n\n![[Assets/socks.png]]', 'A weekend outfit');
 const fm = properties(result);
 assert.deepEqual(fm.categories, ['[[Clothing]]']);
 assert(!('pieces' in fm)); assert(!('category' in fm));
 assert(!result.includes('{{date}}'));
 assert(!/^# /m.test(result));
 assert.match(result, /## Pieces\n\n!\[\[Assets\/top.png\]\]\n\n!\[\[Assets\/socks.png\]\]/);
 assert.match(result, /## Notes\n\nA weekend outfit/);
});
test('custom template keeps properties and prose and inserts notes once', () => {
 const result = buildOutfitNote('---\noccasion: casual\n---\nIntro\n\n## Pieces\n\n## Notes\n{{notes}}', '![[shoe.jpg]]', 'Cost $& and $1');
 assert.equal(properties(result).occasion, 'casual');
 assert.match(result, /Intro/);
 assert.equal(result.split('Cost $& and $1').length - 1, 1);
 assert.equal(result.split('## Pieces').length - 1, 1);
 assert.match(result, /!\[\[shoe.jpg\]\]/);
});
test('inserted notes preserve literal replacement characters', () => {
 const result = buildOutfitNote('## Notes', '![[shoe.jpg]]', '$& $` $1');
 assert(result.includes('$& $` $1'));
});
test('malformed or non-mapping front matter fails instead of producing a corrupt note', () => {
 assert.throws(() => buildOutfitNote('---\n[bad\n---', '', ''));
 assert.throws(() => buildOutfitNote('---\n- item\n---', '', ''));
});
