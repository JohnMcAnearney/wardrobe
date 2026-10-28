import { normalizePath, TFolder, Vault } from "obsidian";

export function outfitFolder(value: string): string {
 const input = value.trim();
 if (!input || input === "/") return "";
 if (input.startsWith("/") || input.includes("\\") || input.split("/").some(part => part === "." || part === "..") || /[:*?"<>|\r\n]/.test(input)) {
  throw new Error("Use a folder path inside your vault, without filename punctuation or dot segments.");
 }
 return normalizePath(input).replace(/\/$/, "");
}

export async function ensureOutfitFolder(vault: Vault, path: string): Promise<void> {
 let current = "";
 for (const segment of path.split("/").filter(Boolean)) {
  current = current ? `${current}/${segment}` : segment;
  const existing = vault.getAbstractFileByPath(current);
  if (existing && !(existing instanceof TFolder)) throw new Error(`A file already exists at ${current}. Choose a different outfit folder.`);
  if (!existing) await vault.createFolder(current);
 }
}
