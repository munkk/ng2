import { Component, Optional, Output, EventEmitter, OnInit, ViewEncapsulation } from '@angular/core';
import { RootService } from 'ng2-qgrid/infrastructure/component/root.service';
import { Command } from 'ng2-qgrid/core/command/command';
import { clone } from 'ng2-qgrid/core/utility/index';
import { QueryBuilderService } from './query-builder.service';
import { WhereSchema } from './schema/where.schema';
import { convert } from './schema/converter';
import { PluginComponent } from '../plugin.component';
import { SerializationService } from '../expression-builder/serialization.service';
import { INodeSchema } from '../expression-builder/model/node.schema';
import { Node } from '../expression-builder/model/node';
import { EbNodeService } from '../expression-builder/eb-node.service';
import { EbNodeComponent } from '../expression-builder/eb-node.component';
import { TraverseService } from '../expression-builder/traverse.service';
import { FocusAfterRender } from 'ng2-qgrid/common/focus/focus.service';


@Component({
	selector: 'q-grid-query-builder-panel',
	templateUrl: './query-builder-panel.component.html',
	providers: [FocusAfterRender]
})
export class QueryBuilderPanelComponent extends PluginComponent implements OnInit {
	node: Node;
	@Output() close = new EventEmitter<any>();
	queryService: QueryBuilderService;

	private traverse = new TraverseService();

	addGroup = new Command({
		execute: () => {
			const current = this.nodeService.current;
			const parent = this.findLogicalNode(current);
			const group = parent.clone();
			parent.addChildAfter(group, current.id === '#condition' && current);
			if (current.id === '#condition') {
				this.nodeService.current = group;
			}
		},
		canExecute: () => !!this.findLogicalNode(this.nodeService.current)
	});

	addRule = new Command({
		execute: () => {
			const current = this.nodeService.current;
			const parent = this.findLogicalNode(current);
			const rule = this.plan.materialize('#condition');
			parent.addChildAfter(rule, current.id === '#condition' && current);
			if (current.id === '#condition') {
				this.nodeService.current = rule;
			}
		},
		canExecute: () => !!this.findLogicalNode(this.nodeService.current)
	});

	remove = new Command({
		execute: () => {
			const current = this.nodeService.current;
			if (current.id === '#logical' && current.level === 1) {
				current.clear();
			} else {
				const previous = this.traverse.findUpSibling(current);
				this.nodeService.current = previous;
				current.remove();
			}
		},
		canExecute: () => {
			const current = this.nodeService.current;
			return current && (current.id === '#condition' || (current.level > 1 || current.children.length > 0));
		}
	});

	submit = new Command({
		source: 'query-builder.component',
		execute: () => {
			const serializer = new SerializationService();
			const node = serializer.serialize(this.node);

			const by = clone(this.model.filter().by);
			by.$expression = convert(node);

			this.model.filter({ by });
			this.model.queryBuilder({ node: by.$expression ? node : null });

			this.close.emit();
		},
		canExecute: () => {
			const depth = this.traverse.depth(this.node);
			return depth((memo, expression, line, node) =>
				node.attr('placeholder')
					? memo
					: memo && expression.isValid()
				, true);
		}
	});

	cancel = new Command({
		source: 'query-builder.component',
		execute: () => {
			this.close.emit();
		}
	});

	reset = new Command({
		source: 'query-builder.component',
		execute: () => {
			const schema = new WhereSchema(this.queryService);
			const plan = schema.factory();
			this.node = plan.apply();

			const root = this.node.children[0];
			root.clear();

			this.nodeService.current = this.node.children[0];

		}
	});

	private plan: INodeSchema;

	constructor(
		@Optional() root: RootService,
		private nodeService: EbNodeService,
		focusAfterRender: FocusAfterRender) {
		super(root);
	}

	ngOnInit() {
		super.ngOnInit();

		this.queryService = new QueryBuilderService(this.model);

		const schema = new WhereSchema(this.queryService);
		this.plan = schema.factory() as any;
		this.node = this.plan.apply();

		const serializer = new SerializationService();
		const { node } = this.model.queryBuilder();
		if (node) {
			this.node = serializer.deserialize(this.plan, node);
		}

		this.nodeService.current = this.node.children[0];
	}

	private findLogicalNode(node: Node) {
		return this.traverse.findUp(node, n => n.id === '#logical');
	}
}
