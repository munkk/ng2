import { isFunction } from '../../core/utility';
import { AppError } from '../../core/infrastructure';
import { PipeUnit } from '../../core/pipe/pipe.unit';
import { PluginView } from '../plugin.view';
import { serialize as serializeGet } from '../../core/rest/get.serialize';
import { serialize as serializePost } from '../../core/rest/post.serialize';

export class RestView extends PluginView {
	constructor(model, { get, post }) {
		super(model);

		const { method, url, serialize } = this.model.rest();
		if (!url) {
			throw new AppError('rest', 'REST endpoint URL is required');
		}

		const fetch = this.fetchFactory(method, get, post);
		const doSerialize = this.serializeFactory(method, serialize);

		model.data({
			pipe: [
				(data, context, next) => {
					fetch(url, doSerialize(model)).then(data => next(data));
				},
				...PipeUnit.view
			]
		});
	}

	fetchFactory(method, get, post) {
		switch (method.toLowerCase()) {
			case 'get':
				return get;
			case 'post':
				return post;
			default:
				throw new AppError('rest', `"${method}" is incorrect REST method`);
		}
	}

	serializeFactory(method, serialize) {
		if (isFunction(serialize)) {
			return serialize;
		} else if (method === 'get') {
			return serializeGet;
		} else if (method === 'post') {
			return serializePost;
		}
	}
}
