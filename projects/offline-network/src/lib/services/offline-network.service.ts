import { HttpErrorResponse, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { Configuration } from '../api';
import { generateHttpRequestKey } from '../helpers';
import { CONFIGURATION } from '../tokens';

import { StorageService } from './storage.service';

@Injectable({
	providedIn: 'root',
})
export class OfflineNetworkService {
	constructor(
		@Inject(CONFIGURATION) private readonly configuration: Configuration,
		private readonly storage: StorageService,
	) {}

	collectResponse<T, R>(request: HttpRequest<T>, event: HttpEvent<R>): void {
		if (event instanceof HttpResponse) {
			this.persist(request, event).then(() => {
				console.warn(`Offline Network: Original request ${request.urlWithParams} saved.`);
			});
		}
	}

	handleError<T, R>(request: HttpRequest<T>, err: HttpErrorResponse): Observable<HttpResponse<R>> {
		if (!navigator.onLine && err.status === 0) {
			// connection is lost
			return from(this.retrieve<T>(request)).pipe(
				map((result) => {
					if (result) {
						return new HttpResponse<R>(result);
					}

					throw err;
				}),
				tap(() => {
					console.warn(
						`Offline Network: Original request to ${request.urlWithParams} replaced with static cache!`,
					);
				}),
			);
		}

		// don't handle another errors
		return throwError(err);
	}

	protected persist<T, R>(request: HttpRequest<T>, response: HttpResponse<R>): Promise<boolean> {
		const key = generateHttpRequestKey(request);

		return this.storage.persist(key, response);
	}

	protected retrieve<T>(request: HttpRequest<T>): Promise<object | null> {
		const key = generateHttpRequestKey(request);

		return this.storage.retrieve(key);
	}
}
