import { Plugin, PluginSettingTab, Setting, Notice, type SettingDefinitionItem } from "obsidian";
import { outfitFolder } from "./folders";
import { WardrobeView, WARDROBE_VIEW } from "./wardrobe";

export default class WardrobePlugin extends Plugin {
 settings = { templateFolder: "Templates", outfitFolder: "Outfits", imageProperty: "image", filterProperty: "categories", filterValue: "[[Clothing]]", typeProperty: "type", rows: ["Hats", "Jackets", "Tops", "Trousers", "Shoes"] };
 async onload(): Promise<void> {
  const saved: unknown = await this.loadData();
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
   const data = saved as Record<string, unknown>;
   for (const key of ["templateFolder", "outfitFolder", "imageProperty", "filterProperty", "filterValue", "typeProperty"] as const) {
    const value = data[key];
    if (typeof value === "string" && (key === "templateFolder" || key === "outfitFolder" || value.trim())) this.settings[key] = value.trim();
   }
   if (Array.isArray(data.rows)) {
    const rows: unknown[] = data.rows;
    this.settings.rows = rows.filter((row): row is string => typeof row === "string" && !!row.trim()).map(row => row.trim()).filter((row, index, values) => values.findIndex(value => value.toLowerCase() === row.toLowerCase()) === index);
   }
  }
  this.addSettingTab(new WardrobeSettings(this.app, this));
  this.registerView(WARDROBE_VIEW, leaf => new WardrobeView(leaf, this));
  const openWardrobe = async (): Promise<void> => {
   const leaf = this.app.workspace.getLeavesOfType(WARDROBE_VIEW)[0] ?? this.app.workspace.getLeaf("tab");
   await leaf.setViewState({ type: WARDROBE_VIEW, active: true });
   await this.app.workspace.revealLeaf(leaf);
  };
  this.addRibbonIcon("shirt", "Open wardrobe", () => { void openWardrobe(); });
  this.addCommand({ id: "open", name: "Open", callback: () => { void openWardrobe(); } });
 }
}

 const propertyFields = [
   ["imageProperty", "Image property", "Property containing a link to the item image.", "image"],
   ["filterProperty", "Note filter property", "Property checked to decide which notes appear.", "categories"],
   ["filterValue", "Note filter value", "Required value, either a single value or an entry in a list. Wiki links and plain text are supported; matching ignores capitalisation.", "[[Clothing]]"],
   ["typeProperty", "Type property", "Property used to group clothing notes to rows. Use the organise clothing section to write to this property quickly.", "type"],
  ] as const;

class WardrobeSettings extends PluginSettingTab {
 constructor(app: WardrobePlugin["app"], private plugin: WardrobePlugin) { super(app, plugin); }
 getSettingDefinitions(): SettingDefinitionItem[] {
  return [
   ...propertyFields.map(([key, name, desc, fallback]) => ({
    name, desc,
    render: (setting: Setting) => this.renderProperty(setting, key, fallback),
   })),
   { name: "Outfit destination folder", desc: "Where to save outfit notes. Nested folders are created automatically. Leave blank for the vault root.", render: (setting: Setting) => this.renderDestination(setting) },
   { name: "Template folder", desc: "Folder containing your templates.", render: (setting: Setting) => this.renderTemplateFolder(setting) },
  ];
 }
 private renderProperty(setting: Setting, key: typeof propertyFields[number][0], fallback: string): void {
  setting.addText(input => input.setPlaceholder(fallback).setValue(this.plugin.settings[key]).onChange(async value => {
   this.plugin.settings[key] = value.trim() || fallback;
   await this.plugin.saveData(this.plugin.settings);
  }));
 }
 display(): void {
  this.containerEl.empty();
  this.containerEl.addClass("wardrobe-settings");
  new Setting(this.containerEl)
   .setName("Property selection")
   .setDesc("All fields are required. Choose the front matter properties used by your notes. Select the refresh button in the wardrobe after changing these settings. Property names must match your notes.")
   .setHeading();
  for (const [key, name, description, fallback] of propertyFields) {
   this.renderProperty(new Setting(this.containerEl).setName(name).setDesc(description), key, fallback);
  }
  this.renderDestination(new Setting(this.containerEl).setName("Outfit destination folder").setDesc("Where to save outfit notes. Nested folders are created automatically. Leave blank for the vault root."));
  this.renderTemplateFolder(new Setting(this.containerEl).setName("Template folder").setDesc("Folder containing your templates."));
 }
 private renderDestination(setting: Setting): void {
  setting.addText(input => {
   input.setPlaceholder("Outfits").setValue(this.plugin.settings.outfitFolder);
   input.inputEl.addEventListener("change", () => {
    try {
     const folder = outfitFolder(input.getValue());
     this.plugin.settings.outfitFolder = folder;
     input.setValue(folder);
     void this.plugin.saveData(this.plugin.settings).catch(() => { new Notice("Could not save the outfit folder setting."); });
    } catch (error) {
     new Notice(error instanceof Error ? error.message : String(error));
     input.setValue(this.plugin.settings.outfitFolder);
    }
   });
  });
 }
 private renderTemplateFolder(setting: Setting): void {
  setting.addText(input => input.setValue(this.plugin.settings.templateFolder).onChange(async value => {
   this.plugin.settings.templateFolder = value.trim();
   await this.plugin.saveData(this.plugin.settings);
  }));
 }
}
