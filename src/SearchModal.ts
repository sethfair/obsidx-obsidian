import {
	App,
	FileSystemAdapter,
	Modal,
	Notice,
	Platform,
	TFile,
	debounce,
	setIcon,
} from "obsidian";
import type ObsidxPlugin from "./main";
import type { ObsidxResult } from "./client";
import { highlightSegments, tokenize } from "./highlight";
import { cleanExcerpt, splitPath, toVaultRelative } from "./paths";

const DEBOUNCE_MS = 180;

/**
 * Omnisearch-style search modal.
 *
 * We take a stock Obsidian `Modal`, strip it, and adopt the app's native
 * `.prompt` / `.suggestion-item` / `.prompt-instructions` classes so the
 * selected-row accent and footer match the quick switcher for free. Rows are
 * built with `obsidx-result__*` spans (see styles.css).
 */
export class SearchModal extends Modal {
	private plugin: ObsidxPlugin;
	private inputEl!: HTMLInputElement;
	private resultsEl!: HTMLDivElement;
	private results: ObsidxResult[] = [];
	private selected = 0;
	private showExcerpt: boolean;
	private basePath: string;
	private runSearch: () => void;

	constructor(app: App, plugin: ObsidxPlugin) {
		super(app);
		this.plugin = plugin;
		this.showExcerpt = plugin.settings.showExcerpt;
		const adapter = app.vault.adapter;
		this.basePath =
			adapter instanceof FileSystemAdapter ? adapter.getBasePath() : "";
		this.runSearch = debounce(() => void this.performSearch(), DEBOUNCE_MS);
	}

	onOpen(): void {
		const { modalEl } = this;
		modalEl.replaceChildren();
		modalEl.removeClass("modal");
		modalEl.addClass("prompt", "obsidx-modal");

		// --- input row (search box + "Create note") ---
		const inputContainer = modalEl.createDiv("prompt-input-container");
		this.inputEl = inputContainer.createEl("input", {
			cls: "prompt-input",
			attr: { type: "text", placeholder: "Semantic search…", enterkeyhint: "go" },
		});
		const createBtn = inputContainer.createEl("button", {
			cls: "obsidx-create-note",
			text: "Create note",
		});
		createBtn.addEventListener("click", () => void this.createNote());

		// --- results ---
		this.resultsEl = modalEl.createDiv("prompt-results");

		// --- footer hint legend ---
		this.buildInstructions(modalEl);

		this.inputEl.addEventListener("input", () => this.runSearch());
		this.registerKeys();
		this.inputEl.focus();
		void this.probeHealth();
	}

	private buildInstructions(parent: HTMLElement): void {
		const mod = Platform.isMacOS ? "⌘" : "Ctrl";
		const hints: Array<[string, string]> = [
			["↑↓", "to navigate"],
			["↵", "to open"],
			[`${mod} ↵`, "to open in a new tab"],
			[`${mod} G`, "to toggle excerpts"],
			["Shift ↵", "to create note"],
			["Esc", "to close"],
		];
		const wrap = parent.createDiv("prompt-instructions");
		for (const [cmd, label] of hints) {
			const item = wrap.createDiv("prompt-instruction");
			item.createSpan({ cls: "prompt-instruction-command", text: cmd });
			item.createSpan({ text: label });
		}
	}

	private registerKeys(): void {
		this.scope.register([], "ArrowDown", (e) => {
			e.preventDefault();
			this.move(1);
			return false;
		});
		this.scope.register([], "ArrowUp", (e) => {
			e.preventDefault();
			this.move(-1);
			return false;
		});
		this.scope.register([], "Enter", () => {
			void this.openSelected(false);
			return false;
		});
		this.scope.register(["Mod"], "Enter", () => {
			void this.openSelected(true);
			return false;
		});
		this.scope.register(["Shift"], "Enter", () => {
			void this.createNote();
			return false;
		});
		this.scope.register(["Mod"], "g", (e) => {
			e.preventDefault();
			this.showExcerpt = !this.showExcerpt;
			this.render();
			return false;
		});
		// Esc → close is handled by Modal's default scope.
	}

	private async probeHealth(): Promise<void> {
		const ok = await this.plugin.client.health();
		if (!ok && !this.inputEl.value) {
			this.renderMessage(
				"obsidx-error",
				"Can't reach the obsidx recall server. Start it with `obsidx-recall-server`, then check the URL in settings."
			);
		}
	}

	private async performSearch(): Promise<void> {
		const query = this.inputEl.value.trim();
		if (!query) {
			this.results = [];
			this.resultsEl.empty();
			return;
		}
		try {
			this.results = await this.plugin.client.search(
				query,
				this.plugin.settings.topN
			);
			this.selected = 0;
			this.render();
		} catch (err) {
			this.renderMessage(
				"obsidx-error",
				`Search failed: ${err instanceof Error ? err.message : String(err)}`
			);
		}
	}

	private move(delta: number): void {
		if (!this.results.length) return;
		const n = this.results.length;
		this.selected = (this.selected + delta + n) % n;
		this.updateSelection();
	}

	private updateSelection(): void {
		const rows = Array.from(
			this.resultsEl.querySelectorAll<HTMLElement>(".obsidx-result")
		);
		rows.forEach((row, i) => row.toggleClass("is-selected", i === this.selected));
		rows[this.selected]?.scrollIntoView({ block: "nearest" });
	}

	private render(): void {
		const tokens = tokenize(this.inputEl.value);
		this.resultsEl.empty();

		if (!this.results.length) {
			this.renderMessage("obsidx-empty", "No results.");
			return;
		}

		this.results.forEach((r, i) => {
			const rel = toVaultRelative(r.path, this.basePath);
			const { dir, base, ext } = splitPath(rel);

			const row = this.resultsEl.createDiv({
				cls: "suggestion-item obsidx-result",
			});
			row.toggleClass("is-selected", i === this.selected);
			row.addEventListener("mouseenter", () => {
				this.selected = i;
				this.updateSelection();
			});
			row.addEventListener("click", () => {
				this.selected = i;
				void this.openSelected(false);
			});

			// title row: icon + name + ext + score
			const titleC = row.createDiv("obsidx-result__title-container");
			const title = titleC.createDiv("obsidx-result__title");
			setIcon(title.createSpan("obsidx-result__icon"), "file-text");
			this.appendHighlighted(title.createSpan(), base, tokens);
			if (ext && ext !== "md") {
				title.createSpan({ cls: "obsidx-result__extension", text: "." + ext });
			}
			titleC.createSpan({
				cls: "obsidx-result__counter",
				text: formatScore(r.score),
			});

			// folder path row
			const folder = row.createDiv("obsidx-result__folder-path");
			setIcon(folder.createSpan("obsidx-result__icon"), "folder-open");
			this.appendHighlighted(folder.createSpan(), dir || "/", tokens);

			// meta row: heading path + status/scope + tags
			const metaBits: string[] = [];
			if (r.heading_path) metaBits.push(r.heading_path);
			if (r.status) metaBits.push("status: " + r.status);
			if (r.scope) metaBits.push("scope: " + r.scope);
			const tags = (r.tags ?? []).filter(Boolean);
			if (tags.length) metaBits.push(tags.map((t) => "#" + t).join(" "));
			if (metaBits.length) {
				row.createDiv({
					cls: "obsidx-result__meta",
					text: metaBits.join("  ·  "),
				});
			}

			// excerpt
			if (this.showExcerpt && r.content) {
				this.appendHighlighted(
					row.createDiv("obsidx-result__body"),
					cleanExcerpt(r.content),
					tokens
				);
			}
		});
	}

	/** Append text to `parent`, wrapping matched tokens in highlight spans. */
	private appendHighlighted(
		parent: HTMLElement,
		text: string,
		tokens: string[]
	): void {
		for (const seg of highlightSegments(text, tokens)) {
			if (seg.match) {
				parent.createSpan({
					cls: "suggestion-highlight obsidx-highlight obsidx-default-highlight",
					text: seg.text,
				});
			} else {
				parent.appendText(seg.text);
			}
		}
	}

	private renderMessage(cls: string, text: string): void {
		this.resultsEl.empty();
		this.resultsEl.createDiv({ cls, text });
	}

	private async openSelected(newTab: boolean): Promise<void> {
		const r = this.results[this.selected];
		if (!r) return;
		const rel = toVaultRelative(r.path, this.basePath);
		const file = this.app.vault.getAbstractFileByPath(rel);
		this.close();
		if (file instanceof TFile) {
			const leaf = this.app.workspace.getLeaf(newTab ? "tab" : false);
			await leaf.openFile(file, {
				eState: { line: Math.max(0, r.start_line - 1) },
			});
		} else {
			// Fall back to link resolution if the path didn't map cleanly.
			void this.app.workspace.openLinkText(rel, "", newTab);
		}
	}

	private async createNote(): Promise<void> {
		const raw = this.inputEl.value.trim();
		if (!raw) return;
		const safe = raw.replace(/[\\/:*?"<>|]/g, "-");
		const path = `${safe}.md`;
		try {
			const existing = this.app.vault.getAbstractFileByPath(path);
			const file =
				existing instanceof TFile
					? existing
					: await this.app.vault.create(path, "");
			this.close();
			await this.app.workspace.getLeaf(false).openFile(file);
		} catch (err) {
			new Notice(
				`Couldn't create note: ${err instanceof Error ? err.message : String(err)}`
			);
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

/** Render an obsidx relevance score as a compact right-aligned label. */
function formatScore(score: number): string {
	if (!isFinite(score)) return "";
	if (score > 0 && score <= 1) return `${Math.round(score * 100)}%`;
	return score.toFixed(2);
}
