import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Optional, Output, NgZone } from '@angular/core';
import { EventManager } from 'ng2-qgrid/core/infrastructure/event.manager';
import { EventListener } from 'ng2-qgrid/core/infrastructure/event.listener';
import { DragService } from 'ng2-qgrid/core/drag/drag.service';
import { GRID_PREFIX } from 'ng2-qgrid/core/definition';
import { Command } from 'ng2-qgrid/core/command/command';
import { isUndefined } from 'ng2-qgrid/core/utility/kit';

@Directive({
	selector: '[q-grid-drop]'
})
export class DropDirective {
	private targetData: any;

	@Input('q-grid-drop') drop: Command<{ event: DragEvent, dragData: any, dropData: any }>;
	@Input('q-grid-drop-data') data: any;
	@Input('q-grid-drag-over') dragOver: Command<{ event: DragEvent, dragData: any, dropData: any }>;
	@Input('q-grid-drop-area') area: string;

	constructor(private elementRef: ElementRef, zone: NgZone) {
		const element = elementRef.nativeElement;
		const listener = new EventListener(element, new EventManager(this));

		element.classList.add(`${GRID_PREFIX}-can-drop`);
		zone.runOutsideAngular(() => {
			listener.on('dragenter', this.onEnter);
			listener.on('dragover', this.onOver);
			listener.on('dragleave', this.onLeave);
		});

		listener.on('drop', this.onDrop);
	}

	onDrop(e: DragEvent) {
		e.stopPropagation();

		this.elementRef.nativeElement.classList.remove(`${GRID_PREFIX}-dragover`);
		const eventArg = {
			event: e,
			dragData: DragService.data,
			dropData: isUndefined(this.targetData) ? this.data : this.targetData
		};

		if (this.drop.canExecute(eventArg)) {
			this.drop.execute(eventArg);
		}

		delete this.targetData;
		return false;
	}

	onEnter(e: DragEvent) {
		e.preventDefault();

		this.elementRef.nativeElement.classList.add(`${GRID_PREFIX}-dragover`);
		e.dataTransfer.dropEffect = 'move';
		return false;
	}

	onOver(e: DragEvent) {
		e.preventDefault();

		const eventArg = {
			event: e,
			dragData: DragService.data,
			dropData: this.data
		};

		let effect = 'move';
		if (this.area === DragService.area && this.dragOver.canExecute(eventArg)) {
			this.targetData = this.dragOver.execute(eventArg);
		} else {
			effect = 'none';
		}

		e.dataTransfer.dropEffect = effect;
		return false;
	}

	onLeave() {
		this.elementRef.nativeElement.classList.remove(`${GRID_PREFIX}-dragover`);
	}
}
