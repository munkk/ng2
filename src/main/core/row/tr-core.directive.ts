import {Directive, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';
import {ViewCoreService} from 'ng2-qgrid/main/core/view';
import {RootService} from 'ng2-qgrid/infrastructure/component';

@Directive({
  selector: '[q-grid-core-tr]'
})
export class TrCoreDirective implements OnInit, OnDestroy {
  @Input('q-grid-core-tr') public index: number;
  private element: HTMLElement;

  constructor(public $view: ViewCoreService,
              private root: RootService,
              private elementRef: ElementRef) {
    this.element = elementRef.nativeElement;
  }

  ngOnInit() {
    const element = this.element;
    this.root.bag.set(element, this);
    this.$view.style.monitor.row.add(element);
  }

  ngOnDestroy() {
    const element = this.element;
    this.root.bag.delete(element);
    this.$view.style.monitor.row.remove(this.element);
  }
}
