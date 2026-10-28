<h1 align="center">Wardrobe</h1>
<div align="center">

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22wardrobe%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json) ![latest download](https://img.shields.io/github/downloads/JohnMcAnearney/Obsidian-Wardrobe/latest/total?style=plastic)

</div>


Build outfits from clothing notes using snapping image rows. Save a combination as a Markdown note containing image embeds.

## Setup 🛠️

Enable **Wardrobe** in Obsidian’s community plugins, then use the shirt icon or run **Wardrobe: Open** from the command palette.

In **Settings → Wardrobe**, choose the front matter properties used by your notes:

| Setting | Default | Purpose | Required |
| --- | --- | --- | --- |
| Image property | `image` | A single wiki link to the item’s image in this vault |✅|
| Note filter property | `categories` | The property checked to include a note |✅|
| Note filter value | `[[Clothing]]` | Either on its own or in a list |✅|
| Type property | `type` | Determines which row contains the item |✅|
| Outfit destination folder | `Outfits` | Folder for saved outfits; leave blank for vault root |❌|
| Template folder | `Templates` | Folder containing your Markdown templates |❌|

Property names must match your notes. Filter values and row names ignore casing. Wiki links and plain text filter values are supported.

### Example clothing item markdown file
Create one Markdown note per clothing item. 

```yaml
---
categories:
  - "[[Clothing]]"
type: Tops
image: "[[Assets/white-shirt.png]]"
---
```

The image must exist in your vault. Use its full vault path when filenames repeat. Notes inside the template folder are excluded from the wardrobe.

## Layer rows

The default rows are Hats, Jackets, Tops, Trousers and Shoes, but you can add more. 

Use **Add layer** at the bottom of **Build your outfit** to add new layers such as 'Socks'. Each row has a remove button. You can drag & drop (on desktop) to reorder rows, or use the up/down buttons on both platforms - you can also use a keyboard. 

The order persists and controls the image order in saved outfits. Removing a row does not delete or edit clothing notes.

## Quality of Life: clothing assignment

Notes with empty or unrecognised types appear under **Organise clothing**. Choosing a row there updates the configured type property in the item’s note. Items from removed rows can be reassigned here.

Select **Refresh** after changing settings or editing notes, images or templates outside the wardrobe.

## Saving outfits

Centre a piece for it to be selected. Choose **None** to skip a row. Select at least one piece and enter a unique outfit name, which becomes the filename in the configured outfit destination folder (`Outfits` by default). Existing notes are not overwritten.

Choose the default clothing template or a Markdown template from your configured template folder. Use the default template as a guide to what I use. 

Image embeds link to image files rather than clothing notes, so they do not create backlinks to the clothing notes. Add clothing-note links manually if you want those graph connections.

## Privacy and compatibility

Wardrobe runs locally, makes no network requests, and requires no accounts or AI service. Settings are stored in the plugin's local data.

Requires Obsidian 1.7.2 or later.

Licensed under [GPL-3.0-only](LICENSE).
