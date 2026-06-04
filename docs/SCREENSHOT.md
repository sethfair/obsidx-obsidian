# Capturing the README screenshot

The README references `docs/screenshot.png`. To produce it:

1. Start the recall server against your vault:
   ```bash
   obsidx-recall-server --db /path/to/your/vault/.obsidian-index/obsidx.db
   ```
2. In Obsidian, enable the plugin and run **Obsidx Semantic Search: Semantic search**
   (or click the ribbon search icon).
3. Type a representative query so several results render with excerpts visible.
4. Capture just the modal:
   - macOS: `Cmd+Shift+4`, then `Space`, then click the modal.
5. Save the PNG as `docs/screenshot.png` (this file's folder) and commit:
   ```bash
   git add docs/screenshot.png && git commit -m "docs: add modal screenshot" && git push
   ```

Recommended: use the default dark theme and a width of ~700–900px so the image
reads well in the GitHub README and the community plugin listing.
