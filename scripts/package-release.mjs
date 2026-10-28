import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const { version } = JSON.parse(await readFile('manifest.json', 'utf8'));
const folder = `dist/${version}`;
await mkdir(folder, { recursive: true });
const sums = [];
for (const file of ['main.js', 'manifest.json', 'styles.css']) {
 await copyFile(file, `${folder}/${file}`);
 sums.push(`${createHash('sha256').update(await readFile(file)).digest('hex')}  ${file}`);
}
await writeFile(`${folder}/SHA256SUMS`, sums.join('\n') + '\n');
console.log(`Release assets prepared in ${folder}`);
