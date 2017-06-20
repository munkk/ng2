import {NgModule} from '@angular/core';
import {TemplateDirective} from './template.directive';
import {TemplateLinkDirective} from './template-link.directive';
import {TemplateCacheDirective} from './template-cache.directive';
import {TemplateLinkService} from './template-link.service';
import {TemplateCacheService} from './template-cache.service';
import {TemplateHostService} from './template-host.service';

@NgModule({
  declarations: [
    TemplateDirective,
    TemplateLinkDirective,
    TemplateCacheDirective
  ],
  exports: [
    TemplateDirective,
    TemplateLinkDirective,
    TemplateCacheDirective
  ],
  imports: [],
  providers: [
    TemplateLinkService,
    TemplateCacheService,
    TemplateHostService
  ]
})
export class TemplateModule {
}

