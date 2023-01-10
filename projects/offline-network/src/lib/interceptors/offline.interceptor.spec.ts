import {
	HTTP_INTERCEPTORS,
	HttpClient,
	HttpErrorResponse,
	HttpEventType,
} from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';

import { OfflineNetworkService } from '../services';

import { OfflineInterceptor } from './offline.interceptor';

import createSpyObj = jasmine.createSpyObj;
import objectContaining = jasmine.objectContaining;
import SpyObj = jasmine.SpyObj;

describe('OfflineInterceptor', () => {
	let interceptor: OfflineInterceptor;
	let offlineNetworkService: SpyObj<OfflineNetworkService>;
	let httpClient: HttpClient;
	let httpController: HttpTestingController;

	beforeEach(() => {
		offlineNetworkService = createSpyObj<OfflineNetworkService>('OfflineNetworkService', [
			'collectResponse',
			'handleError',
		]);

		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [
				OfflineInterceptor,
				{ provide: OfflineNetworkService, useValue: offlineNetworkService },
				{ provide: HTTP_INTERCEPTORS, multi: true, useClass: OfflineInterceptor },
			],
		});

		httpClient = TestBed.inject(HttpClient);
		httpController = TestBed.inject(HttpTestingController);
	});

	beforeEach(() => {
		interceptor = TestBed.inject(OfflineInterceptor);
	});

	it('should be created', () => {
		expect(interceptor).toBeTruthy();
	});

	it('should collect response', (done) => {
		const body = { list: [] };
		const options = { status: 200, statusText: 'OK' };

		httpClient.get('/books').subscribe({
			next: (value) => {
				expect(value).toEqual(body);
			},
			complete: () => {
				expect(offlineNetworkService.collectResponse).toHaveBeenCalledWith(
					objectContaining({ url: '/books', body: null, method: 'GET' }),
					objectContaining({
						body,
						type: HttpEventType.Response,
						status: 200,
						statusText: 'OK',
						url: '/books',
						ok: true,
					}),
				);

				done();
			},
		});

		httpController.expectOne('/books').flush(body, options);
		httpController.verify();
	});

	it('should catch error', (done) => {
		const eventError = new ErrorEvent('Unknown Error');

		offlineNetworkService.handleError.and.callFake((request, err) => throwError(err));

		httpClient.get('/films').subscribe({
			next: () => fail(),
			error: (err) => {
				expect(err).toBeInstanceOf(HttpErrorResponse);
				expect(err).toEqual(
					new HttpErrorResponse({ status: 0, url: '/films', statusText: '', error: eventError }),
				);

				done();
			},
			complete: () => fail(),
		});

		httpController.expectOne('/films').error(eventError);
		httpController.verify();
	});
});
