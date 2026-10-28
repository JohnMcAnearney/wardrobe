import { ItemView, WorkspaceLeaf, TFile, Notice, normalizePath, setIcon } from "obsidian";
import { buildOutfitNote, DEFAULT_OUTFIT_TEMPLATE } from "./outfitNote";
import { renderLayerControls } from "./layerControls";
import { outfitFolder, ensureOutfitFolder } from "./folders";
import type WardrobePlugin from "./main";

export const WARDROBE_VIEW = "wardrobe-view";
const aliases: Record<string, string> = { hat: "Hats", hats: "Hats", accessories: "Hats", jacket: "Jackets", jackets: "Jackets", coat: "Jackets", coats: "Jackets", top: "Tops", tops: "Tops", shirt: "Tops", "t-shirt": "Tops", tshirt: "Tops", jumper: "Tops", trousers: "Trousers", jeans: "Trousers", pants: "Trousers", shorts: "Trousers", shoes: "Shoes", trainers: "Shoes", boots: "Shoes", sneakers: "Shoes" };
function text(value: unknown): string {
	return Array.isArray(value) ? value.map(text).join(" ") : typeof value === "string" ? value : "";
}
function clean(value: string): string { return value.replace(/[[\]]/g, "").split("|")[0]!.trim(); }
interface Item { file: TFile; image: TFile | null; row: string; }

export class WardrobeView extends ItemView {
	private selected = new Map<string, Item>();
	private items: Item[] = [];
	private title = "";
	private notes = "";
	private templatePath = "";
	private get rows(): string[] { return this.plugin.settings.rows; }
	constructor(leaf: WorkspaceLeaf, private plugin: WardrobePlugin) { super(leaf); }
	getViewType(): string { return WARDROBE_VIEW; }
	getDisplayText(): string { return "Wardrobe"; }
	getIcon(): string { return "shirt"; }
	async onOpen(): Promise<void> { this.refresh(); }
	private refresh(): void {
		this.items = [];
		for (const file of this.app.vault.getMarkdownFiles()) {
			if (file.path.startsWith(this.plugin.settings.templateFolder + "/")) continue;
			const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
			if (!fm) continue;
			const categories: unknown[] = [fm[this.plugin.settings.filterProperty]];
			const isClothing = categories.some(value => (Array.isArray(value) ? value : [value]).some(entry => clean(text(entry)).toLowerCase() === clean(this.plugin.settings.filterValue).toLowerCase()));
			if (!isClothing) continue;
			const imageLink = clean(text(fm[this.plugin.settings.imageProperty]));
			const type = clean(text(fm[this.plugin.settings.typeProperty])).toLowerCase();
			this.items.push({ file, image: imageLink ? this.app.metadataCache.getFirstLinkpathDest(imageLink, file.path) : null, row: this.rows.find(row => row.toLowerCase() === type) ?? this.rows.find(row => row === aliases[type]) ?? "" });
		}
		this.items.sort((a, b) => a.file.basename.localeCompare(b.file.basename));
		for (const [row, item] of this.selected) {
			const current = this.items.find(i => i.file.path === item.file.path && i.row === row);
			if (current) this.selected.set(row, current); else this.selected.delete(row);
		}
		this.render();
	}
	private render(): void {
		const host = this.contentEl;
		host.empty(); host.addClass("wardrobe-view");
		const root = host.createDiv({ cls: "wardrobe-shell" });
		const header = root.createDiv({ cls: "wardrobe-toolbar" });
		const heading = header.createDiv({ cls: "wardrobe-heading" });
		const mark = heading.createSpan({ cls: "wardrobe-mark" }); setIcon(mark, "shirt");
		const headingText = heading.createDiv();
			headingText.createEl("h2", { text: "Wardrobe" });
		const refresh = header.createEl("button", { cls: "wardrobe-refresh", attr: { "aria-label": "Refresh wardrobe", title: "Refresh wardrobe" } });
		setIcon(refresh, "refresh-cw"); refresh.onclick = () => { this.refresh(); new Notice("Wardrobe refreshed"); };
		const metadata = root.createDiv({ cls: "wardrobe-metadata" });
		const details = metadata.createDiv({ cls: "wardrobe-field" });
		details.createEl("label", { text: "Outfit name" });
		details.createEl("p", { text: "The name of your saved outfit note.", cls: "wardrobe-help" });
		const name = details.createEl("input", { type: "text", placeholder: "e.g. Sunday in the city", value: this.title });
		name.setAttribute("aria-label", "Outfit name");
		name.oninput = () => { this.title = name.value; };
		const templateField = metadata.createDiv({ cls: "wardrobe-field" });
		templateField.createEl("label", { text: "Outfit template" });
		const picker = templateField.createEl("select");
		picker.setAttribute("aria-label", "Outfit template");
		picker.createEl("option", { text: "Default clothing template", value: "" });
		const prefix = this.plugin.settings.templateFolder.replace(/\/$/, "") + "/";
		for (const file of this.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(prefix)).sort((a,b) => a.path.localeCompare(b.path))) {
			picker.createEl("option", { text: file.path.slice(prefix.length), value: file.path });
		}
		picker.value = this.templatePath;
		if (picker.selectedIndex < 0) { picker.value = ""; this.templatePath = ""; }
		picker.onchange = () => { this.templatePath = picker.value; save.disabled = false; };
		templateField.createEl("p", { text: "Choose the layout for your saved note.", cls: "wardrobe-help" });
		const layers = root.createDiv({ cls: "wardrobe-layers" });
		const layersHeader = layers.createDiv({ cls: "wardrobe-section-heading" });
		layersHeader.createEl("h3", { text: "Build your outfit" });
		layersHeader.createSpan({ cls: "wardrobe-count", text: `${this.items.length} pieces · ${this.rows.length} layers` });
		layersHeader.createEl("p", { cls: "wardrobe-layer-help", text: "Pieces appear in the output note in the order you see below. Pieces whose type property matches the layer name, will appear." });
		for (const row of this.rows) this.renderRow(layers, row);
		this.renderAddLayer(layers);
		const notesField = root.createDiv({ cls: "wardrobe-field" });
		notesField.createEl("label", { text: "Notes" });
		notesField.createEl("p", { text: "Optional: occasions, styling ideas or anything to remember.", cls: "wardrobe-help" });
		const notes = notesField.createEl("textarea", { placeholder: "Where will you wear it? Add a styling idea or reminder…" });
		notes.value = this.notes; notes.setAttribute("aria-label", "Outfit notes");
		notes.oninput = () => { this.notes = notes.value; };
		const actions = root.createDiv({ cls: "wardrobe-actions" });
		actions.createSpan({ text: `Saving to destination: ${this.plugin.settings.outfitFolder || "vault root"}`, cls: "wardrobe-help" });
		const save = actions.createEl("button", { text: "Save outfit", cls: "mod-cta" });
		save.disabled = false;
		save.onclick = () => { save.disabled = true; void this.save().finally(() => { save.disabled = false; }); };
		const unassigned = this.items.filter(i => !i.row);
		if (unassigned.length) {
			const assignments = root.createEl("details", { cls: "wardrobe-maintenance" });
			assignments.createEl("summary", { text: `Organise clothing · ${unassigned.length} unassigned` });
			assignments.createEl("p", { text: `Choose a type for these pieces. This updates the ${this.plugin.settings.typeProperty} property in the clothing note.` });
			for (const item of unassigned) {
				const line = assignments.createDiv({ cls: "wardrobe-assignment" });
				line.createSpan( { text: item.file.basename });
				const select = line.createEl("select");
				select.setAttribute("aria-label", `Row for ${item.file.basename}`);
				select.createEl("option", { text: "Choose type", value: "" });
				for (const row of this.rows) select.createEl("option", { text: row, value: row });
				select.onchange = () => { if (!select.value) return; select.disabled = true;
					void this.app.fileManager.processFrontMatter(item.file, (fm: Record<string, unknown>) => { fm[this.plugin.settings.typeProperty] = select.value; })
						.then(() => { item.row = select.value; this.render(); })
						.catch(() => { select.disabled = false; new Notice("Could not update this clothing note."); });
				};
			}
		}
		if (!this.items.length) root.createEl("p", { text: `No clothing found. Set ${this.plugin.settings.filterProperty} to ${this.plugin.settings.filterValue} and add an image link in ${this.plugin.settings.imageProperty}, then refresh.` });
	}
	private renderAddLayer(root: HTMLElement): void {
		const footer = root.createDiv({ cls: "wardrobe-add-layer" });
		const add = footer.createEl("button", { text: "Add layer" });
		const form = footer.createDiv({ cls: "wardrobe-new-layer" });
		form.hidden = true;
		const input = form.createEl("input", { type: "text", placeholder: "Layer name, e.g. Socks", attr: { "aria-label": "New layer name", maxlength: "60" } });
		const confirm = form.createEl("button", { text: "Add", cls: "mod-cta" });
		const cancel = form.createEl("button", { text: "Cancel" });
		add.onclick = () => { form.hidden = false; add.hidden = true; input.focus(); };
		cancel.onclick = () => { form.hidden = true; add.hidden = false; input.value = ""; add.focus(); };
		const submit = (): void => {
			const name = input.value.trim();
			if (!name || name.length > 60 || /[[\]\r\n]/.test(name)) { new Notice("Enter a layer name of 1–60 characters without brackets."); return; }
			if (this.rows.some(row => row.toLowerCase() === name.toLowerCase())) { new Notice("That layer already exists."); return; }
			void this.updateRows([...this.rows, name]);
		};
		confirm.onclick = submit;
		input.onkeydown = event => {
			if (event.key === "Enter") { event.preventDefault(); submit(); }
			if (event.key === "Escape") cancel.click();
		};
	}
	private async updateRows(rows: string[]): Promise<void> {
		const previous = this.plugin.settings.rows;
		this.plugin.settings.rows = rows;
		try { await this.plugin.saveData(this.plugin.settings); this.refresh(); }
		catch { this.plugin.settings.rows = previous; new Notice("Could not save wardrobe rows."); }
	}
	private renderRow(root: HTMLElement, row: string): void {
		const section = root.createEl("section", { cls: "wardrobe-row" });
		const rowHeading = section.createDiv({ cls: "wardrobe-row-heading" });
		rowHeading.createEl("h4", { text: row });
		renderLayerControls(rowHeading, section, row, this.rows, rows => { void this.updateRows(rows); });
		const selection = rowHeading.createSpan({ cls: "wardrobe-row-selection", text: "None" });
		const strip = section.createDiv({ cls: "wardrobe-carousel" });
		strip.setAttribute("aria-label", row);
		const choices: (Item | null)[] = [null, ...this.items.filter(i => i.row === row)];
		const cards: HTMLButtonElement[] = [];
		let active = Math.max(0, choices.findIndex(i => i?.file.path === this.selected.get(row)?.file.path));
		const choose = (index: number): void => {
			active = index; const item = choices[index];
			selection.textContent = item?.file.basename ?? "None";
			if (item) this.selected.set(row, item); else this.selected.delete(row);
			cards.forEach((card, i) => { card.toggleClass("is-selected", i === index); card.setAttribute("aria-pressed", String(i === index)); });
		};
		choices.forEach((item, index) => {
			const card = strip.createEl("button", { cls: "wardrobe-card" }); cards.push(card);
			if (item?.image) {
				const img = card.createEl("img", { attr: { src: this.app.vault.getResourcePath(item.image), alt: item.file.basename, loading: "lazy" } });
				img.draggable = false;
			}
			if (!item?.image) { const placeholder = card.createSpan({ cls: "wardrobe-placeholder" }); setIcon(placeholder, item ? "image-off" : "minus"); }
			card.createSpan( { text: item?.file.basename ?? "None" });
			card.onclick = () => { choose(index); strip.scrollTo({ left: card.offsetLeft - strip.offsetLeft - (strip.clientWidth - card.offsetWidth) / 2, behavior: strip.ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
			card.onkeydown = event => {
				if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
				event.preventDefault(); const next = cards[Math.max(0, Math.min(cards.length - 1, active + (event.key === "ArrowRight" ? 1 : -1)))]; next?.focus({ preventScroll: true }); next?.click();
			};
		});
		choose(active);
		strip.onscroll = () => {
			const centre = strip.getBoundingClientRect().left + strip.clientWidth / 2;
			let nearest = 0, distance = Infinity;
			cards.forEach((card, i) => { const rect = card.getBoundingClientRect(); const d = Math.abs(rect.left + rect.width / 2 - centre); if (d < distance) { distance = d; nearest = i; } });
			choose(nearest);
		};
		const card = cards[active];
		if (card) {
			const win = strip.ownerDocument.defaultView;
			if (win) {
				const frame = win.requestAnimationFrame(() => { if (strip.isConnected) strip.scrollLeft = card.offsetLeft - strip.offsetLeft - (strip.clientWidth - card.offsetWidth) / 2; });
				this.register(() => win.cancelAnimationFrame(frame));
			}
		}
	}
	private async save(): Promise<void> {
		try {
			
			const title = this.title.trim();
			if (!title || /[\\/:*?"<>|#[\]\r\n]/.test(title) || title === "." || title === "..") { new Notice("Enter an outfit name without filename punctuation."); return; }
			if (!this.selected.size) { new Notice("Choose at least one clothing item."); return; }
			const folder = outfitFolder(this.plugin.settings.outfitFolder);
			await ensureOutfitFolder(this.app.vault, folder);
			const path = normalizePath(`${folder ? folder + "/" : ""}${title}.md`);
			if (this.app.vault.getAbstractFileByPath(path)) { new Notice("An outfit with that name already exists. Choose another name."); return; }
			const items = this.rows.map(row => this.selected.get(row)).filter((item): item is Item => !!item);
			if (items.some(item => !item.image)) { new Notice("A selected piece has no valid image. Fix the configured image property before saving."); return; }
			let template = DEFAULT_OUTFIT_TEMPLATE;
			if (this.templatePath) {
				const source = this.app.vault.getAbstractFileByPath(this.templatePath);
				if (!(source instanceof TFile)) throw new Error("The selected template no longer exists.");
				template = await this.app.vault.read(source);
			}
			const pieces = items.map(item => `![[${item.image!.path}]]`).join("\n\n");
			const content = buildOutfitNote(template, pieces, this.notes);
			const file = await this.app.vault.create(path, content);
			new Notice("Outfit saved."); await this.app.workspace.getLeaf("tab").openFile(file);
		} catch (error) { new Notice(`Could not save outfit: ${error instanceof Error ? error.message : String(error)}`); }
	}
}
