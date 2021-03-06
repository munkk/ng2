import { VscrollPort } from './vscroll.port';
import { VscrollDirective } from './vscroll.directive';
import { VscrollBox } from './vscroll.box';
import { IVscrollSettings } from './vscroll.settings';
import { VscrollContainer } from './vscroll.container';
import { isNumber } from 'ng2-qgrid/core/utility';
import { AppError } from 'ng2-qgrid/core/infrastructure';

export class VscrollLink {
	private box = new VscrollBox();
	private ticking = false;

	constructor(private port: VscrollPort) {
		const view = port.view;
		const layout = port.layout;
		const settings = this.settings;
		const container = this.container;

		if (settings.placeholderHeight > 0 || settings.placeholderWidth > 0) {
			const width = settings.placeholderWidth || (isNumber(settings.columnWidth) && settings.columnWidth as number);
			const height = settings.placeholderHeight || (isNumber(settings.rowHeight) && settings.rowHeight as number);
			view.drawPlaceholder(width, height);
		}

		view.scrollEvent.subscribe(() => this.update(false));

		view.resetEvent.subscribe(e => {
			if (e.handled) {
				return;
			}

			e.handled = settings.resetTriggers.indexOf(e.source) < 0;
			container.resetEvent.emit(e);
		});

		container.resetEvent.subscribe(e => {
			if (e.handled) {
				return;
			}

			container.cursor = layout.reset();
			port.reset();
		});

		container.updateEvent.subscribe(e => {
			if (e.force) {
				this.update(true);
			}
		});
	}

	tick(force) {
		this.ticking = false;

		const port = this.port;
		const count = this.container.count;
		const position = port.layout.recycle(count, this.box, force);
		if (position) {
			this.container.apply(
				() => this.container.cursor = port.layout.invalidate(position),
				f => port.emit(f));
		}
	}

	update(force = false) {
		const view = this.port.view;
		this.container.read(() => {
			const element = view.element;
			const newBox = {
				scrollWidth: element.scrollWidth,
				scrollHeight: element.scrollHeight,
				scrollTop: element.scrollTop,
				scrollLeft: element.scrollLeft,
				portWidth: element.clientWidth,
				portHeight: element.clientHeight
			};

			if (force || this.port.hasChanges(newBox, this.box)) {
				this.box = newBox;
				if (this.container.count && !this.ticking) {
					this.ticking = true;
					this.container.tick(() => this.tick(force));
				}
			}
		});
	}

	private get settings() {
		return this.port.context.settings;
	}

	private get container() {
		return this.port.context.container;
	}
}
