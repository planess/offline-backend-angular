import { HttpErrorResponse, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { Configuration } from '../api';
import { generateHttpRequestKey } from '../helpers';
import { CONFIGURATION } from '../tokens';

import { LogService } from './log.service';
import { StorageService } from './storage.service';

@Injectable({
	providedIn: 'root',
})
export class OfflineNetworkService {
	constructor(
		@Inject(CONFIGURATION) private readonly configuration: Configuration,
		private readonly storage: StorageService,
		private readonly log: LogService,
	) {}

	async collectResponse<T, R>(request: HttpRequest<T>, event: HttpEvent<R>): Promise<void> {
		if (event instanceof HttpResponse) {
			return this.persist(request, event).then(() => {
				this.log.write(`Original request ${request.urlWithParams} saved.`);
			});
		}
	}

	handleError<T, R>(request: HttpRequest<T>, err: HttpErrorResponse): Observable<HttpResponse<R>> {
		if (
			(!navigator.onLine && err.status === 0) ||
			(this.configuration.includeServerOff && Math.floor(err.status / 100) === 5)
		) {
			// connection is lost or server is down
			return from(this.retrieve<T, R>(request)).pipe(
				map((result) => {
					if (result) {
						return new HttpResponse<R>(result);
					}

					throw err;
				}),
				tap(() => {
					this.log.write(
						`Original request to ${request.urlWithParams} replaced with static cache!`,
					);
				}),
			);
		}

		// don't handle another errors
		return throwError(err);
	}

	protected persist<T, R>(request: HttpRequest<T>, response: HttpResponse<R>): Promise<void> {
		const key = generateHttpRequestKey(request);

		return this.storage.persist(key, response);
	}

	protected async retrieve<T, R>(request: HttpRequest<T>): Promise<R | null> {
		const key = generateHttpRequestKey(request);
		const data = await this.storage.retrieve<R>(key);

		if (!data) {
			return null;
		}

		const { value, updatedAt } = data;

		if (this.configuration.maxAge > 0) {
			const milliseconds = this.configuration.maxAge * 60 * 60 * 1000;

			if (new Date().getTime() - updatedAt > milliseconds) {
				// cache is out, delete it
				await this.storage.delete(key);

				return null;
			}
		}

		return value;
	}
}
