import {NgModule} from '@angular/core';
import {MainModule} from './main';
import {ThemeService as Theme} from './themes/material/theme.service';
import {Model} from 'ng2-qgrid/core/infrastructure';
import {setup} from 'ng2-qgrid/core';
import {GridComponent} from "./main/grid";
import {ColumnListComponent, ColumnComponent} from "./main/column";
import {ThemeModule} from "ng2-qgrid/theme/theme.module";
import {ThemeService} from "ng2-qgrid/template";
import {TemplateLinkService} from 'ng2-qgrid/template';

@NgModule({
  declarations: [
  ],
  exports: [
    GridComponent,
    ColumnListComponent,
    ColumnComponent
  ],
  imports: [
    MainModule,
    ThemeModule
  ],
  providers: [
    TemplateLinkService,
    ThemeService
  ]
})
export class GridModule {
  constructor(themeService: ThemeService, theme: Theme) {
    setup(Model);
    themeService.name = theme.name;
  }
}
