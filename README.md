# Obsidx Semantic Search

An [Obsidian](https://obsidian.md) plugin that brings an **Omnisearch-style search modal** to your vault — but powered by **[obsidx](https://github.com/sethfair/obsidx)**, a local semantic search engine (embeddings + HNSW + reranking) instead of keyword matching.

Type a natural-language query, get back the most *semantically relevant* notes — ranked, with heading paths, frontmatter, and excerpts.

![screenshot placeholder](docs/screenshot.png)

## How it works

```
Obsidian (this plugin)  ──POST /search──▶  obsidx-recall-server  ──▶  SQLite + HNSW + Ollama
```

This plugin is a thin client. The actual indexing and search run in the **obsidx recall server** on your machine. The plugin sends your query to `http://localhost:8765/search` and renders the results in a familiar quick-switcher–style modal.

## Prerequisites

1. **[obsidx](https://github.com/sethfair/obsidx)** installed, with your vault indexed:
   ```bash
   obsidx-indexer --vault /path/to/your/vault
   ```
2. **[Ollama](https://ollama.com)** running with an embedding model (default `nomic-embed-text`).
3. The **recall server** running:
   ```bash
   obsidx-recall-server --db /path/to/your/vault/.obsidian-index/obsidx.db
   ```
   (defaults to port `8765`)

## Install

### Manual / development

```bash
git clone https://github.com/sethfair/obsidx-obsidian
cd obsidx-obsidian
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` into
`<your-vault>/.obsidian/plugins/obsidx/` and enable the plugin in
**Settings → Community plugins**. For live development, symlink the repo into
that folder and run `npm run dev`.

### BRAT

Add `sethfair/obsidx-obsidian` as a beta plugin in
[BRAT](https://github.com/TfTHacker/obsidian42-brat).

## Usage

- Run the command **"Obsidx Semantic Search: Semantic search"** (or click the
  ribbon search icon) to open the modal.
- Keyboard:
  | Key | Action |
  | --- | --- |
  | `↑` / `↓` | Navigate results |
  | `↵` | Open |
  | `Cmd/Ctrl + ↵` | Open in a new tab |
  | `Cmd/Ctrl + G` | Toggle excerpts |
  | `Shift + ↵` | Create a note titled by the query |
  | `Esc` | Close |

## Settings

| Setting | Default | Notes |
| --- | --- | --- |
| Recall server URL | `http://localhost:8765` | Base URL of `obsidx-recall-server` |
| Results | `20` | `top_n` sent to the server |
| Show excerpts | on | Content snippet under each result |

## Development

```bash
npm run dev      # esbuild watch → main.js
npm test         # vitest (pure logic: highlighting, paths, request building)
npm run build    # typecheck + production bundle
```

## License

MIT © Seth Fair
