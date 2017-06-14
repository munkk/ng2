import {Injectable} from '@angular/core';
import {Guard} from 'ng2-qgrid/core/infrastructure';
import {CommandManager} from "ng2-qgrid/infrastructure/command";

@Injectable()
export class RootService {
  private gridModel: any = null;
  public markup: any = {};
  public bag = new Map<HTMLElement, any>();
  public table: any = null;
  public commandManager = new CommandManager();

  constructor() {
    this.markup.document = document;
  }

  get model() {
    Guard.notNull(this.gridModel, 'model');

    return this.gridModel;
  }

  set model(value) {
    this.gridModel = value
  }
}
