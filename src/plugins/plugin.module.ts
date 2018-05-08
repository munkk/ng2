import { NgModule } from '@angular/core';
import { ColumnSortModule } from './column-sort/column-sort.module';
import { PagerModule } from './pagination/pager.module';
import { ProgressModule } from './progress/progress.module';
import { ColumnChooserModule } from './colum-chooser/column-chooser.module';
import { DataManipulationModule } from './data-manipulation/data-manipulation.module';
import { ActionBarModule } from './action-bar/action-bar.module';
import { TitleModule } from './title/title.module';
import { ColumnFilterModule } from './column-filter/column-filter.module';
import { MenuModule } from './menu/menu.module';
import { CellEditorModule } from './cell-editor/cell-editor.module';
import { BoolEditorModule } from './bool-editor/bool-editor.module';
import { TabTrapModule } from './tab-trap/tab-trap.module';
import { BackdropModule } from './backdrop/backdrop.module';
import { SelectModule } from './select/select.module';
import { LegendModule } from './legend/legend.module';
import { ChipsModule } from './chips/chips.module';
import { ReferenceEditorModule } from './reference-editor/reference-editor.module';
import { PersistenceModule } from './persistence/persistence.module';
import { ColumnChooserModel } from 'ng2-qgrid/plugin/column-chooser/column.chooser.model';
import { ColumnFilterModel } from 'ng2-qgrid/plugin/column-filter/column.filter.model';
import { DataManipulationModel } from 'ng2-qgrid/plugin/data-manipulation/data.manipulation.model';
import { StatusBarModule } from 'ng2-qgrid/plugins/status-bar/status-bar.module';
import { QueryBuilderModule } from 'ng2-qgrid/plugins/query-builder/query-builder.module';
import { QueryBuilderModel } from 'ng2-qgrid/plugins/query-builder/query-builder.model';
import { EbModule } from 'ng2-qgrid/plugins/expression-builder/eb.module';
import { RestModule } from 'ng2-qgrid/plugins/rest/rest.module';
import { Model } from 'ng2-qgrid/core/infrastructure/model';

Model.register('columnChooser', ColumnChooserModel)
	.register('columnFilter', ColumnFilterModel)
	.register('dataManipulation', DataManipulationModel)
	.register('queryBuilder', QueryBuilderModel);

@NgModule({
	declarations: [],
	exports: [
		ActionBarModule,
		DataManipulationModule,
		PagerModule,
		ColumnChooserModule,
		ColumnSortModule,
		ColumnFilterModule,
		ProgressModule,
		TitleModule,
		MenuModule,
		CellEditorModule,
		BoolEditorModule,
		ReferenceEditorModule,
		TabTrapModule,
		BackdropModule,
		SelectModule,
		StatusBarModule,
		LegendModule,
		ChipsModule,
		PersistenceModule,
		QueryBuilderModule,
		EbModule,
		RestModule
	]
})
export class PluginModule { }
