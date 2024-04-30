import { parseCsv, Row } from "csv";
import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface BookKeeperSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: BookKeeperSettings = {
	mySetting: "default",
};

export default class BookKeeper extends Plugin {
	settings: BookKeeperSettings;

	startApp() {
		const modal = new ImportSelectionModal(this.app);
		modal.open();
	}

	async onload() {
		await this.loadSettings();

		// this.registerMarkdownCodeBlockProcessor("bookkeeper", MarkdownCodeProcessor);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				this.startApp();
			},
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "bookkeeper-load-data-here",
			name: "Load data into this page",
			editorCallback: (editor: Editor) => {
				const modal = new ImportSelectionModal(this.app);
				async function cb(rows: Row[]) {
					if (rows.length == 0) {
						return;
					}

					// let content = "```bookkeeper\n";
					//
					let content = rows[0].header();

					content += rows.map((rec) => rec.toMarkdown()).join("\n");
					// content += "\n```";

					editor.replaceRange(content, editor.getCursor());
					modal.close();
				}
				modal.setHandler(cb);
				modal.open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000),
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

export type ImportHandler = (rows: Row[]) => Promise<void>;

class ImportSelectionModal extends Modal {
	handler: ImportHandler;

	constructor(app: App) {
		super(app);
	}

	setHandler(handler: ImportHandler) {
		this.handler = handler;
	}

	onOpen() {
		const importFile = new Setting(this.contentEl).setName(
			"Select CSV file to import",
		);
		const importDataFile = importFile.controlEl.createEl("input", {
			attr: {
				type: "file",
				multiple: false,
				accept: ".csv,.txt,.tsv",
			},
		});
		// const triggerImport = new Setting(this.contentEl).setName("Import").setDesc("Start Import");
		const triggerBtn = importFile.controlEl.createEl("button");
		triggerBtn.textContent = "Start Import";
		triggerBtn.onclick = async () => {
			const { files: data_files_list } = importDataFile;
			if (data_files_list == null || data_files_list.length === 0) {
				return;
			}
			// For now only do one file
			const content = await data_files_list[0].text();
			const rows: Row[] = parseCsv(content);
			await this.handler(rows);
		};
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: BookKeeper;

	constructor(app: App, plugin: BookKeeper) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}