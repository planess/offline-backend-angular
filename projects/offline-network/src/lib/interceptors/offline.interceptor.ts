import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { OfflineNetworkService } from '../services';

@Injectable()
export class OfflineInterceptor implements HttpInterceptor {
	constructor(private readonly offlineNetworkService: OfflineNetworkService) {}

	intercept<T, R>(request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<R>> {
		return next.handle(request).pipe(
			tap((response) => this.offlineNetworkService.collectResponse(request, response)),
			catchError((err) => this.offlineNetworkService.handleError<T, R>(request, err)),
		);
	}
}
