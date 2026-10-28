import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import vm from 'node:vm';
class Plugin {
 async loadData() { return this.saved; }
 addSettingTab(tab) { this.tab = tab; }
 registerView() {} addRibbonIcon() {} addCommand() {}
}
class PluginSettingTab { constructor(app, plugin) { this.app = app; this.plugin = plugin; } }
const result = await build({ entryPoints: ['src/main.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['obsidian'] });
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require: () => ({ Plugin, PluginSettingTab, ItemView: class {}, TFolder: class {} }) });
const Wardrobe = module.exports.default;
test('saved settings are validated before being used', async () => {
 const plugin = new Wardrobe();
 plugin.saved = { imageProperty: 123, filterProperty: null, typeProperty: ' slot ', outfitFolder: '', rows: ['Tops', ' tops ', 42, '', 'Socks'] };
 await plugin.onload();
 assert.equal(plugin.settings.imageProperty, 'image');
 assert.equal(plugin.settings.filterProperty, 'categories');
 assert.equal(plugin.settings.typeProperty, 'slot');
 assert.equal(plugin.settings.outfitFolder, '');
 assert.deepEqual(Array.from(plugin.settings.rows), ['Tops', 'Socks']);
});
test('all six settings have searchable definitions and shared renderers', async () => {
 const plugin = new Wardrobe();
 await plugin.onload();
 const definitions = plugin.tab.getSettingDefinitions();
 assert.deepEqual(Array.from(definitions, def => def.name), ['Image property', 'Note filter property', 'Note filter value', 'Type property', 'Outfit destination folder', 'Template folder']);
 for (const def of definitions) {
  assert.equal(typeof def.render, 'function');
  assert.equal(typeof def.desc, 'string');
 }
 assert.equal(typeof plugin.tab.display, 'function');
});
