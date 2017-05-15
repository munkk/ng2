import {NgModule} from '@angular/core';
import {PagerComponent} from './pager.component';
import {TemplateModule} from '@grid/template/template.module';

@NgModule({
  declarations: [
    PagerComponent
  ],
  exports: [
    PagerComponent
  ],
  imports: [
    TemplateModule
  ],
  providers: []
})
export class PagerModule {
}
