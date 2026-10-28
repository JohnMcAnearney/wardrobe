import { setIcon } from "obsidian";

/** Move a layer before/after another layer without mutating the saved order. */
export function moveLayer(rows: string[], source: string, target: string, after = false): string[] {
 if (source === target || !rows.includes(source) || !rows.includes(target)) return [...rows];
 const next = rows.filter(row => row !== source);
 next.splice(next.indexOf(target) + (after ? 1 : 0), 0, source);
 return next;
}

export function renderLayerControls(
 heading: HTMLElement, section: HTMLElement, row: string, rows: string[],
 update: (rows: string[]) => void,
): void {
 const controls = heading.createDiv({ cls: "wardrobe-layer-controls" });
 const button = (label: string, icon: string): HTMLButtonElement => {
  const el = controls.createEl("button", { cls: "wardrobe-layer-button", attr: { "aria-label": label, title: label } });
  setIcon(el, icon); return el;
 };
 const handle = button(`Drag to reorder ${row}`, "grip-vertical");
 handle.draggable = true;
 handle.addClass("wardrobe-drag-handle");
 handle.ondragstart = event => {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData("application/x-wardrobe-layer", row);
  event.dataTransfer.effectAllowed = "move";
  section.addClass("is-dragging");
 };
 handle.ondragend = () => {
  section.removeClass("is-dragging");
  section.parentElement?.querySelectorAll(".is-drop-before, .is-drop-after").forEach(el => el.classList.remove("is-drop-before", "is-drop-after"));
 };
 const isLayer = (event: DragEvent): boolean => Array.from(event.dataTransfer?.types ?? []).includes("application/x-wardrobe-layer");
 section.ondragover = event => {
  if (!isLayer(event)) return;
  event.preventDefault();
  const rect = section.getBoundingClientRect();
  const after = event.clientY > rect.top + rect.height / 2;
  section.toggleClass("is-drop-before", !after);
  section.toggleClass("is-drop-after", after);
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
 };
 section.ondragleave = event => {
  if (event.relatedTarget && section.contains(event.relatedTarget as Node)) return;
  section.removeClass("is-drop-before", "is-drop-after");
 };
 section.ondrop = event => {
  if (!isLayer(event)) return;
  event.preventDefault();
  const source = event.dataTransfer?.getData("application/x-wardrobe-layer") ?? "";
  const rect = section.getBoundingClientRect();
  section.removeClass("is-drop-before", "is-drop-after");
  if (source !== row && rows.includes(source)) update(moveLayer(rows, source, row, event.clientY > rect.top + rect.height / 2));
 };
 const index = rows.indexOf(row);
 const up = button(`Move ${row} up`, "chevron-up");
 up.disabled = index === 0;
 up.onclick = () => { if (index > 0) update(moveLayer(rows, row, rows[index - 1]!)); };
 const down = button(`Move ${row} down`, "chevron-down");
 down.disabled = index === rows.length - 1;
 down.onclick = () => { if (index < rows.length - 1) update(moveLayer(rows, row, rows[index + 1]!, true)); };
 const remove = button(`Remove ${row} layer`, "x");
 remove.onclick = () => update(rows.filter(value => value !== row));
}
