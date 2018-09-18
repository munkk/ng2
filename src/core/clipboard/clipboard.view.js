import { Command } from '../command/command';
import { isUndefined } from '../utility/kit';
import { SelectionCommandManager } from '../selection/selection.command.manager';
import { ClipboardService } from './clipboard.service';
import { SelectionService } from '../selection/selection.service';
import { RowSelector } from '../row/row.selector';
import { EditCellView } from '../edit/edit.cell.view';
import { CommandManager } from '../command/command.manager';
import { CellEditor } from '../edit/edit.cell.editor';
import { EventListener } from '../infrastructure/event.listener';
import { EventManager } from '../infrastructure/event.manager';
import { AppError } from '../infrastructure/error';

export class ClipboardView {
    constructor(model, table, commandManager) {
        this.model = model;
        this.table = table;

        const { shortcut } = model.action();
        const commands = this.commands;
        shortcut.register(commandManager, commands);

        model.clipboardChanged.watch(e => {
            const event = e.state.clipboardEvent;
            this.onPaste(event);
        });
    }

    onPaste(e) {
        e.stopPropagation();
        e.preventDefault();

        const model = this.model;
        const table = this.table;

        const navigationState = model.navigation();
        let initialCell;
        if (navigationState.cell) {
            initialCell = navigationState.cell;
        } else {
            // further cell editing is based on navigation.cell, so selection unit should be specified as a cell
            throw new AppError('clipboard.view', `For paste event switch selection unit to cell`);
            return false;
        }

        const shortcut = { register: () => ({}) };
        const editView = new EditCellView(model, table, shortcut);

        const data = retrieveData(e);

        let nextCellFlag = false;
        let { rowIndex, columnIndex } = initialCell;

        for (let i = 0, dataLength = data.length; i < dataLength; i++) {

            const cells = data[i].split('\t');
            for (let j = 0, cellsLength = cells.length; j < cellsLength; j++) {
                const label = cells[j];
                const isLast = j === cells.length - 1;
                
                if (!nextCellFlag) {
                    const cellView = table.body.cell(rowIndex, columnIndex).model();
                    if (cellView) {
                        editCell(cellView, editView, label);
                    }
                    if (!isLast) {
                        nextCellFlag = true;
                    }
                } else if (nextCellFlag) {
                    columnIndex += 1;
                    const cellView = table.body.cell(rowIndex, columnIndex).model();
                    if (cellView) {
                        editCell(cellView, editView, label);
                    }
                }

                if (isLast) {
                    rowIndex = initialCell.rowIndex + (i + 1);
                    columnIndex = initialCell.columnIndex;
                    nextCellFlag = false;
                }
            }
        }
    }

    get commands() {
        const model = this.model;
        const { shortcut }  = model.clipboard();

        const commands = {
            copy: new Command({
                source: 'clipboard.view',
                canExecute: () => model.selection().items.length > 0,
                execute: () => {
                    const selectionService = new SelectionService(model);
                    const rowSelector = new RowSelector(model);
                    const { items } = model.selection();
                    const entries = selectionService.lookup(items);
                    
                    const area = rowSelector.map(entries);
                    const { source } = model.clipboard();
                    const context = {
                        area,
                        source
                    };

                    ClipboardService.copy(context);
                },
                shortcut: shortcut.copy
            })
        };

        return new Map(
            Object.entries(commands)
        );
    }
}

function editCell(cell, edit, label) {
    const columnType = cell.column.type;
    const labelType = getType(label);

    if (columnType !== 'id' && columnType !== 'array') {
        if (columnType === labelType) {
            const editor = new CellEditor(cell);
            editor.label = label;
            editor.value = label;
            edit.editor = editor;

            if (edit.push.canExecute()) {
                edit.push.execute();
            }
        }
    }
}

function retrieveData(e) {
    const clipboardData = e.clipboardData;
    const pasted = clipboardData.getData('Text');
    const data = pasted.trim();

    return data.split('\n');
}

function getType(text) {
    // needs to be improved
    let symbols = text.split('');
    if (symbols.length > 1) {
        symbols = symbols.slice(0, symbols.length - 1);
    }

    const isText = symbols.every(s => s.charCodeAt(0) >= 65 && s.charCodeAt(0) <= 122);
    if (isText) {
        return 'text';
    }

    const isNumber = symbols.every(s => s.charCodeAt(0) >= 48 && s.charCodeAt(0) <= 57 || s.charCodeAt(0) === 46);
    if (isNumber) {
        return 'number';
    }

    const date = new Date(text);
    if (date && isFinite(date)) {
        return 'date';
    }

    if (text.includes('@')) {
        return 'email';
    }
}