import { Plugin } from "obsidian";
import { ObsidxClient } from "./client";
import { SearchModal } from "./SearchModal";
import {
	DEFAULT_SETTINGS,
	ObsidxSettings,
	ObsidxSettingTab,
} from "./settings";

export default class ObsidxPlugin extends Plugin {
	settings!: ObsidxSettings;
	client!: ObsidxClient;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.client = new ObsidxClient(this.settings.serverUrl);

		this.addCommand({
			id: "search",
			name: "Semantic search",
			callback: () => new SearchModal(this.app, this).open(),
		});

		this.addRibbonIcon("search", "Obsidx semantic search", () =>
			new SearchModal(this.app, this).open()
		);

		this.addSettingTab(new ObsidxSettingTab(this.app, this));
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		// Recreate the client so a changed server URL takes effect immediately.
		this.client = new ObsidxClient(this.settings.serverUrl);
	}
}
