import { App, PluginSettingTab, Setting } from "obsidian";
import type ObsidxPlugin from "./main";

export interface ObsidxSettings {
	/** Base URL of the local obsidx recall server. */
	serverUrl: string;
	/** Number of results to request (top_n). */
	topN: number;
	/** Whether to show the content excerpt under each result. */
	showExcerpt: boolean;
}

export const DEFAULT_SETTINGS: ObsidxSettings = {
	serverUrl: "http://localhost:8765",
	topN: 20,
	showExcerpt: true,
};

export class ObsidxSettingTab extends PluginSettingTab {
	private plugin: ObsidxPlugin;

	constructor(app: App, plugin: ObsidxPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Recall server URL")
			.setDesc(
				"Base URL of your local obsidx-recall-server (start it with `obsidx-recall-server`)."
			)
			.addText((text) =>
				text
					.setPlaceholder("http://localhost:8765")
					.setValue(this.plugin.settings.serverUrl)
					.onChange(async (value) => {
						this.plugin.settings.serverUrl =
							value || DEFAULT_SETTINGS.serverUrl;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Results")
			.setDesc("How many results to request per search (top_n).")
			.addSlider((slider) =>
				slider
					.setLimits(5, 50, 5)
					.setValue(this.plugin.settings.topN)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.topN = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show excerpts")
			.setDesc("Display a content snippet under each result (toggle live with Cmd/Ctrl+G).")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showExcerpt)
					.onChange(async (value) => {
						this.plugin.settings.showExcerpt = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
