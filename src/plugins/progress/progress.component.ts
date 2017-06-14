import {Component, Optional} from '@angular/core';
import {Command} from 'ng2-qgrid/core/infrastructure';
import {PluginComponent} from 'ng2-qgrid/plugins';
import {RootService} from 'ng2-qgrid/infrastructure/component';

@Component({
  selector: 'q-grid-progress',
  template: require('./progress.component.html')
})
export class ProgressComponent extends PluginComponent {
  constructor(@Optional() root: RootService) {
    super(root);

    this.models = ['progress'];
  }


  get isBusy() {
    const progressState = this.model.progress();
    return progressState.isBusy || progressState.queue.length;
  }
}


