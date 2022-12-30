import { HttpRequest } from '@angular/common/http';

export function generateHttpRequestKey<T>(request: HttpRequest<T>): string {
	const params = [request.method, request.urlWithParams];

	if (request.body) {
		params.push(JSON.stringify(request.body));
	}

	return params.join('::');
}
