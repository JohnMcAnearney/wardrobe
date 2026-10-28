import { parseYaml, stringifyYaml } from "obsidian";

export const DEFAULT_OUTFIT_TEMPLATE = `---
categories:
  - "[[Clothing]]"
type:
maker:
model:
materials:
colours:
fit:
personalRating:
price:
weight:
layer:
monthly-uses:
acquired: {{date}}
created: {{date}}
image:
---
`;

/** Preserve template properties and prose while always saving the outfit content. */
export function buildOutfitNote(template: string, pieces: string, notes: string): string {
 const now = new Date();
 const date = `${now.getFullYear()}-${String(now.getMonth() + 1).replace(/^\d$/, "0$&")}-${String(now.getDate()).replace(/^\d$/, "0$&")}`;
 template = template.replace(/\{\{date\}\}/gi, date);
 const match = template.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
 let properties: Record<string, unknown> = {};
 if (match) {
  const parsed: unknown = parseYaml(match[1]!);
  if (parsed !== null && (typeof parsed !== "object" || Array.isArray(parsed))) throw new Error("Template properties must be a YAML mapping.");
  properties = (parsed ?? {}) as Record<string, unknown>;
 }
 delete properties.category;
 let body = match ? template.slice(match[0].length) : template;
 const values: Record<string, string> = { notes, date };
 const hasNotes = /\{\{notes\}\}/i.test(body);
 body = body.replace(/\{\{(?:title|pieces)\}\}/gi, "").replace(/^#\s*$/gm, "");
 body = body.replace(/\{\{(notes|date)\}\}/gi, (_, key: string) => values[key.toLowerCase()]!);
 // Fill existing section placeholders, otherwise add the missing sections.
 const fill = (name: string, value: string): void => {
  const heading = new RegExp(`^## ${name}[ \t]*$`, "m");
  if (heading.test(body)) body = body.replace(heading, () => `## ${name}\n\n${value}`);
  else body += `\n\n## ${name}\n\n${value}`;
 };
 fill("Pieces", pieces);
 if (!hasNotes) fill("Notes", notes);
 return `---\n${stringifyYaml(properties)}---\n\n${body.trim()}\n`;
}
