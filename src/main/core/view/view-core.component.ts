import {Component, Input, Optional} from '@angular/core';
import {NgComponent, RootService} from 'ng2-qgrid/infrastructure/component';
import {Table} from 'ng2-qgrid/core/dom';
import {BodyView} from 'ng2-qgrid/core/body';
import {HeadView} from 'ng2-qgrid/core/head';
import {FootView} from 'ng2-qgrid/core/foot';
import {LayoutView} from 'ng2-qgrid/core/layout';
import {GroupView} from 'ng2-qgrid/core/group';
import {PivotView} from 'ng2-qgrid/core/pivot';
import {NavigationView} from 'ng2-qgrid/core/navigation';
import {HighlightView} from 'ng2-qgrid/core/highlight';
import {SortView} from 'ng2-qgrid/core/sort';
import {FilterView} from 'ng2-qgrid/core/filter';
import {EditView} from 'ng2-qgrid/core/edit';
import {SelectionView} from 'ng2-qgrid/core/selection';
import {PaginationView} from 'ng2-qgrid/core/pagination';
import {TableView} from 'ng2-qgrid/core/table';
import {StyleView} from 'ng2-qgrid/core/style';
import {ColumnView} from 'ng2-qgrid/core/column';
import {ScrollView} from 'ng2-qgrid/core/scroll';
import {isUndefined} from 'ng2-qgrid/core/services/utility';
import {PipeUnit} from 'ng2-qgrid/core/pipe/units';
import {AppError} from 'ng2-qgrid/core/infrastructure';
import {ViewCoreService} from './view-core.service';
import {GridService} from 'ng2-qgrid/main/grid';
import {VScrollService} from '../scroll';
import {CellService} from '../cell';

@Component({
  selector: 'q-grid-core-view',
  templateUrl: './view-core.component.html',
  providers: [
    ViewCoreService,
    CellService
  ]
})
export class ViewCoreComponent extends NgComponent {
  constructor(@Optional() private root: RootService,
              private view: ViewCoreService,
              private gridService: GridService,
              private vscroll: VScrollService) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();

    const model = this.model;
    const table = this.root.table;
    const commandManager = this.root.commandManager;
    const gridService = this.gridService.service(model);

    this.view.style = new StyleView(model, table);
    this.view.head = new HeadView(model, table, 'q-grid-core-th');
    this.view.body = new BodyView(model, table);
    this.view.foot = new FootView(model, table);
    this.view.columns = new ColumnView(model, gridService);
    this.view.layout = new LayoutView(model, table, gridService);
    this.view.selection = new SelectionView(model, table, commandManager);
    this.view.group = new GroupView(model);
    this.view.pivot = new PivotView(model);
    this.view.highlight = new HighlightView(model, table, setTimeout);
    this.view.sort = new SortView(model);
    this.view.filter = new FilterView(model);
    this.view.edit = new EditView(model, table, commandManager);
    this.view.nav = new NavigationView(model, table, commandManager);
    this.view.pagination = new PaginationView(model);
    this.view.scroll = new ScrollView(model, table, this.vscroll, gridService);

    // TODO: how we can avoid that?
    // this.$scope.$watch(this.style.invalidate.bind(this.style));
    //

    model.selectionChanged.watch(e => {
      // TODO: add event
      // if (e.hasChanges('entries')) {
      //   this.root.selectionChanged.emit({
      //     state: model.selection(),
      //     changes: e.changes
      //   });
      // }

      if (e.hasChanges('unit') || e.hasChanges('mode')) {
        gridService.invalidate('selection', e.changes, PipeUnit.column);
      }
    });

    const triggers = model.data().triggers;
    // TODO: think about invalidation queue
    let needInvalidate = true;
    Object.keys(triggers)
      .forEach(name =>
        model[name + 'Changed']
          .watch(e => {
            const changes = Object.keys(e.changes);
            if (e.tag.behavior !== 'core' && triggers[name].find(key => changes.indexOf(key) >= 0)) {
              needInvalidate = false;
              gridService.invalidate(name, e.changes);
            }
          }));

    if (needInvalidate) {
      gridService.invalidate('grid');
    }
  }

  ngOnDestroy() {
    this.view.layout.destroy();
    this.view.nav.destroy();
    this.view.selection.destroy();
  }

  get model() {
    return this.root.model;
  }

  get visibility() {
    return this.model.visibility();
  }
}
