import { PluginView } from '../plugin.view';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { Command, CommandManager } from '../../core/command';
import { stringifyFactory } from '../../core/services/';
import { Shortcut, ShortcutDispatcher } from '../../core/shortcut';
import { clone } from '../../core/utility';
import { Event } from '../../core/infrastructure';
import { groupBy } from '../../core/utility/utility';

export class PersistenceView extends PluginView {
	constructor(model) {
		super();

		this.model = model;
		this.service = new PersistenceService(model);
		this.items = [];
		this.state = {
			editItem: null,
			oldValue: null
		};
		this.closeEvent = new Event();

		const persistence = model.persistence;
		this.id = persistence().id;
		this.title = this.stringify();

		persistence()
			.storage.getItem(this.id)
			.then(items => {
				this.items = items || [];
				this.groups = this.buildGroups(this.items);
			});

		this.using(
			this.model.gridChanged.watch(e => {
				if (e.hasChanges('status') && e.state.status === 'unbound') {
					this.closeEvent.emit();
				}
			})
		);

		this.create = new Command({
			source: 'persistence.view',
			execute: () => {
				const item = {
					title: this.title,
					modified: Date.now(),
					model: this.service.save(),
					isDefault: false,
					group: persistence().defaultGroup,
					canEdit: true
				};

				if (persistence().create.execute(item) !== false) {
					this.items.push(item);
					this.persist();
					this.title = '';
					return true;
				}
				return false;
			},
			canExecute: () => {
				if (!!this.title && this.isUniqueTitle(this.title)) {
					const item = {
						title: this.title,
						modified: Date.now(),
						model: this.service.save(),
						isDefault: false,
						group: persistence().defaultGroup,
						canEdit: true
					};

					return persistence().create.canExecute(item);
				}

				return false;
			}
		});

		this.edit = {
			enter: new Command({
				source: 'persistence.view',
				execute: item => {
					item = item || this.items.find(this.isActive);
					if (!item) {
						return false;
					}
					this.state = {
						editItem: item,
						oldValue: clone(item)
					};
					return true;
				},
				canExecute: item => this.state.editItem === null && item.canEdit
			}),
			commit: new Command({
				source: 'persistence.view',
				shortcut: 'enter',
				execute: item => {
					item = item || this.state.editItem;
					if (persistence().modify.execute(item) !== false) {
						const title = item.title;
						if (!title || !this.isUniqueTitle(title)) {
							this.edit.cancel.execute();
							return false;
						}
						item.modified = Date.now();
						this.persist();
						this.state.editItem = null;
						return true;
					}
					return false;
				},
				canExecute: () =>
					this.state.editItem !== null &&
					persistence().modify.canExecute(this.state.editItem)
			}),
			cancel: new Command({
				source: 'persistence.view',
				shortcut: 'escape',
				execute: () => {
					if (this.state.editItem !== null) {
						const index = this.items.indexOf(this.state.editItem);
						this.items.splice(index, 1, this.state.oldValue);
						this.state.oldValue = null;
						this.state.editItem = null;
					} else {
						this.closeEvent.emit();
					}
					return true;
				}
			})
		};

		this.load = new Command({
			source: 'persistence.view',
			canExecute: item => persistence().load.canExecute(item),
			execute: item => {
				if (persistence().load.execute(item) !== false) {
					this.service.load(item.model);
					return true;
				}

				return false;
			}
		});

		this.remove = new Command({
			source: 'persistence.view',
			execute: item => {
				const index = this.items.indexOf(item);
				if (index >= 0) {
					if (persistence().remove.execute(item) !== false) {
						this.items.splice(index, 1);

						this.persist();
						return true;
					}
				}
				return false;
			},
			canExecute: item =>
				item.canEdit && persistence().remove.canExecute(item)
		});

		this.setDefault = new Command({
			source: 'persistence.view',
			canExecute: item => persistence().setDefault.canExecute(item),
			execute: item => {
				if (persistence().setDefault.execute(item) !== false) {
					const index = this.items.indexOf(item);
					if (index === -1) {
						return false;
					}

					if (item.isDefault) {
						item.isDefault = false;
					} else {
						this.items.forEach(i => (i.isDefault = false));
						item.isDefault = true;
					}
					this.items.splice(index, 1, item);

					this.persist();
					return true;
				}

				return false;
			}
		});

		const commandManager = new CommandManager();
		const shortcut = new Shortcut(new ShortcutDispatcher());

		this.keyDown = e => shortcut.keyDown(e);

		shortcut.register(commandManager, [
			this.edit.enter,
			this.edit.commit,
			this.edit.cancel
		]);
	}

	get blank() {
		const gridModel = this.model;
		const settings = gridModel.persistence().settings;

		const model = {};
		for (const key in settings) {
			const target = {};
			model[key] = target;
			for (const p of settings[key]) {
				switch (key) {
					case 'filter':
						target[p] = {};
						break;
					case 'queryBuilder':
						target[p] = null;
						break;
					default:
						target[p] = [];
				}
			}
		}

		return {
			title: 'Blank',
			modified: Date.now(),
			model: model,
			isDefault: false,
			group: 'blank',
			canEdit: false
		};
	}

	get sortedItems() {
		return this.items.sort((a, b) => b.modified - a.modified);
	}

	buildGroups(items) {
		return items.reduce((memo, item) => {
			const group = memo.find(m => m.key === item.group);
			if (group) {
				group.items.push(item);
			} else {
				memo.push({
					key: item.group,
					items: [item]
				});
			}
			return memo;
		}, []);
	}

	isActive(item) {
		return JSON.stringify(item.model) === JSON.stringify(this.service.save()); // eslint-disable-line angular/json-functions
	}

	persist() {
		this.model
			.persistence()
			.storage.setItem(this.id, this.items.filter(item => item.canEdit));

		this.groups = this.buildGroups(this.items);
	}

	stringify(item) {
		const model = item ? item.model : this.service.save();
		const targets = [];
		const settings = this.model.persistence().settings;

		for (let key in settings) {
			if (!model[key]) {
				continue;
			}
			const stringify = stringifyFactory(key);
			const target = stringify(model[key]);
			if (target !== '') {
				targets.push(target);
			}
		}

		return targets.join('; ') || 'No settings';
	}

	isUniqueTitle(title) {
		return !this.items.some(item => {
			return (
				item !== this.state.editItem &&
				item.title.toLowerCase() === title.trim().toLowerCase()
			);
		});
	}
}
