import {Directive, DoCheck, EmbeddedViewRef, Input, TemplateRef, ViewContainerRef} from '@angular/core';
import {TemplateLinkService} from 'ng2-qgrid/template';
import {TemplateCacheService} from 'ng2-qgrid/template';
import {Guard} from 'ng2-qgrid/core/infrastructure';

@Directive({
  selector: 'ng-container[key]'
})
export class TemplateDirective implements DoCheck {
  @Input() key = '';
  @Input() context = null;
  private template: TemplateRef<any>;
  private viewRef: EmbeddedViewRef<any>;

  constructor(private templateLink: TemplateLinkService,
              private templateCache: TemplateCacheService,
              private viewContainerRef: ViewContainerRef) {
  }

  ngDoCheck() {
    const template =
      this.templateCache.get(this.key) ||
      this.templateLink.get(this.key);

    if (template !== this.template) {
      this.template = template;
      if (this.viewRef) {
        this.viewContainerRef.clear();
      }

      this.viewRef = this.viewContainerRef.createEmbeddedView(template, this.context);
    }
  }
}
