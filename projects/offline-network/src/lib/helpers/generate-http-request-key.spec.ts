import { HttpRequest } from '@angular/common/http';

import { generateHttpRequestKey } from './generate-http-request-key';

describe('generateHttpRequestKey', () => {
	it('should produce key with body', () => {
		const request = {
			method: 'GET',
			body: { field: 'id', id: 25 },
			urlWithParams: '/test/path/to?take=10&skip=0',
		} as HttpRequest<any>;
		const result = generateHttpRequestKey(request);

		expect(result).toBe('GET::/test/path/to?take=10&skip=0::{"field":"id","id":25}');
	});

	it('should produce key without body', () => {
		const request = {
			method: 'POST',
			urlWithParams: '/test/path/to?take=20&skip=5',
		} as HttpRequest<any>;
		const result = generateHttpRequestKey(request);

		expect(result).toBe('POST::/test/path/to?take=20&skip=5');
	});
});
