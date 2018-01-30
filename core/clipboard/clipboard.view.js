import {View} from '../view';
import {Command} from '../command';
import {getType, isUndefined} from '../utility';
import {SelectionCommandManager} from './../selection/selection.command.manager';
import {get, getFactory} from '../services/value';

export class ClipboardView extends View {
	constructor(model, commandManager) {
		super(model);

		const selectionCommandManager = new SelectionCommandManager(model, commandManager);
		const shortcut = model.action().shortcut;
		const commands = this.commands;

		this.using(shortcut.register(selectionCommandManager, commands));
	}

	get commands() {
		const model = this.model;
		const shortcut = model.clipboard().shortcut;

		const commands = {
			copy: new Command({
				source: 'clipboard.view',
				canExecute: () => model.selection().items.length > 0,
				execute: () => {
					const selection = model.selection();
					const unit = selection.unit;
					let items = selection.items;

					switch (unit) {
						case 'cell': {
							items = this.handleCell(items);
							break;
						}
						case 'row': {
							items = this.handleRow(items);
							break;
						}
						case 'column': {
							items = this.handleColumn(items);
							break;
						}

					}

					this.buildTable(items);
					this.selectTable(document.querySelector('.generatedTable'));

				},
				shortcut: shortcut.copy
			})
		};

		return new Map(
			Object.entries(commands)
		);
	}

	handleColumn(columns) {
		let dataModel = model.data();
		let rows = dataModel.rows;
		let accumulator = [];

		for (let i = 0; i < columns.length; i++) {
			let column = columns[i];
			let factory = getFactory(column);
			let cells = rows.map(row => factory(row));

			if (accumulator.length === 0) {
				cells.forEach(() => accumulator.push([]));
			}
			for (let j = 0; j < cells.length; j++) {
				accumulator[j][i] = cells[j];
			}
			debugger;
		}
		return accumulator;
	}

	handleCell(items) {
		let accumulator = [];
		let collection = [];
		let cells = [];

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const column = item.column;
			const row = item.row;
			const key = column.key;

			if (collection.indexOf(key) === -1) {
				const value = get(row, column);
				cells.push(value);
				collection.push(key);
			} else {
				accumulator.push(cells);
				cells = [];
				collection = [];
				const value = get(row, column);
				cells.push(value);
				collection.push(key);
			}
		}

		accumulator.push(cells);

		return accumulator;
	}

	handleRow(items) {
		const accumulator = [];

		for (let i = 0; i < items.length; i++) {
			let item = items[i];
			let values = Object.values(item);

			let collection = [];

			for (let t = 0; t < values.length; t++) {
				let item = values[t];
				extractData(item);

				function extractData(item) {
					let type = getType(item);

					switch (type) {
						case 'Object': {
							let entity = item;
							let values = Object.values(entity);

							for (let j = 0; j < values.length; j++) {
								let val = values[j];
								getType(val) === 'Object' ? extractData(val) : getType(val) === 'Array' ? extractData(val) : collection.push(val);
							}
							break;
						}
						case 'String': {
							collection.push(item);
							break;
						}
						case 'Array': {
							let str = item.join(', ');
							collection.push(str);
							break;
						}

					}

				}
			}
			accumulator.push(collection);
		}

		return accumulator;
	}

	buildTable(data) {
		const table = document.createElement('table');
		table.className = 'generatedTable';

		data.forEach((el) => {
			const tr = document.createElement('tr');
			for (let o in el) {
				const td = document.createElement('td');
				td.appendChild(document.createTextNode(el[o]));
				tr.appendChild(td);
			}
			table.appendChild(tr);
		});

		document.body.appendChild(table);

		return table;
	}

	selectTable(el) {
		let body = document.body, range, sel;

		if (document.createRange && window.getSelection) {
			range = document.createRange();
			sel = window.getSelection();
			sel.removeAllRanges();
			try {
				range.selectNodeContents(el);
				sel.addRange(range);
			} catch (e) {
				range.selectNode(el);
				sel.addRange(range);
			}
			document.execCommand('copy');

		} else if (body.createTextRange) {
			range = body.createTextRange();
			range.moveToElementText(el);
			range.select();
			range.execCommand('copy');
		}
		const table = document.querySelector('.generatedTable');
		table.remove();
	}
}





