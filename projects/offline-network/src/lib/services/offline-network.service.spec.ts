import {
	HttpErrorResponse,
	HttpHeaderResponse,
	HttpRequest,
	HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TestScheduler } from 'rxjs/testing';

import { Configuration } from '../api';
import { generateHttpRequestKey } from '../helpers';
import { CONFIGURATION } from '../tokens';

import { LogService } from './log.service';
import { OfflineNetworkService } from './offline-network.service';
import { StorageService } from './storage.service';

import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;
import stringMatching = jasmine.stringMatching;
import Spy = jasmine.Spy;

describe('OfflineNetworkService', () => {
	let service: OfflineNetworkService;
	let storageService: SpyObj<StorageService>;
	let logService: SpyObj<LogService>;
	let configuration: Configuration;

	beforeEach(() => {
		storageService = createSpyObj<StorageService>('StorageService', [
			'persist',
			'retrieve',
			'delete',
		]);
		logService = createSpyObj<LogService>('LogService', ['alarm', 'write']);

		configuration = { maxAge: 120, includeServerOff: true };

		TestBed.configureTestingModule({
			providers: [
				{ provide: CONFIGURATION, useValue: configuration },
				{ provide: StorageService, useValue: storageService },
				{ provide: LogService, useValue: logService },
			],
		});
		service = TestBed.inject(OfflineNetworkService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('collectResponse', () => {
		let request: HttpRequest<unknown>;
		let key: string;

		beforeEach(() => {
			request = new HttpRequest('GET', '//www.test.com');
			key = generateHttpRequestKey(request);
		});

		it('should ignore', async () => {
			storageService.persist.and.resolveTo();

			const event = new HttpHeaderResponse();

			const result = service.collectResponse(request, event);

			await expectAsync(result).toBeResolved();
			expect(storageService.persist).not.toHaveBeenCalled();
			expect(logService.write).not.toHaveBeenCalled();
		});

		it('should persist event', async () => {
			const event = new HttpResponse();

			storageService.persist.and.resolveTo();

			const result = service.collectResponse(request, event);

			await expectAsync(result).toBeResolved();
			expect(storageService.persist).toHaveBeenCalledOnceWith(key, event);
			expect(logService.write).toHaveBeenCalledOnceWith(
				stringMatching(/^Original request .+ saved.$/),
			);
		});

		it('should reject', async () => {
			const event = new HttpResponse();

			storageService.persist.and.rejectWith();

			const result = service.collectResponse(request, event);

			await expectAsync(result).toBeRejected();
			expect(storageService.persist).toHaveBeenCalledOnceWith(key, event);
			expect(logService.write).not.toHaveBeenCalled();
		});
	});

	describe('handleError', () => {
		let testScheduler: TestScheduler;
		let onLine: Spy;

		beforeEach(() => {
			testScheduler = new TestScheduler((actual, expected) => {
				expect(actual).toEqual(expected);
			});

			onLine = spyOnProperty(window.navigator, 'onLine');
		});

		describe('throw error', () => {
			it('should skip if onLine=true AND includeServerOff=false', () => {
				onLine.and.returnValue(true);

				configuration.includeServerOff = false;

				const request = new HttpRequest('GET', '//www.test.com');
				const err = new HttpErrorResponse({});

				testScheduler.run(({ expectObservable }) => {
					expectObservable(service.handleError(request, err)).toBe('#', undefined, err);
				});
			});

			it('should skip if onLine=false AND includeServerOff=false AND errorStatus=500', () => {
				onLine.and.returnValue(false);

				configuration.includeServerOff = false;

				const request = new HttpRequest('GET', '//www.test.com');
				const err = new HttpErrorResponse({ status: 500 });

				testScheduler.run(({ expectObservable }) => {
					expectObservable(service.handleError(request, err)).toBe('#', undefined, err);
				});
			});

			it('should skip if onLine=true AND includeServerOff=true AND errorStatus=400', () => {
				onLine.and.returnValue(true);

				configuration.includeServerOff = true;

				const request = new HttpRequest('GET', '//www.test.com');
				const err = new HttpErrorResponse({ status: 400 });

				testScheduler.run(({ expectObservable }) => {
					expectObservable(service.handleError(request, err)).toBe('#', undefined, err);
				});
			});

			it('should skip if onLine=false AND includeServerOff=false AND errorStatus=400', () => {
				onLine.and.returnValue(false);

				configuration.includeServerOff = false;

				const request = new HttpRequest('GET', '//www.test.com');
				const err = new HttpErrorResponse({ status: 400 });

				testScheduler.run(({ expectObservable }) => {
					expectObservable(service.handleError(request, err)).toBe('#', undefined, err);
				});
			});

			it('should skip if cache is missing', (done) => {
				onLine.and.returnValue(false);

				configuration.includeServerOff = true;

				const request = new HttpRequest('GET', '//www.test.com');
				const err = new HttpErrorResponse({});
				const key = generateHttpRequestKey(request);

				storageService.retrieve.and.resolveTo(null);

				service.handleError(request, err).subscribe({
					next: () => fail(),
					error: (error) => {
						expect(error).toBe(err);
						expect(storageService.delete).not.toHaveBeenCalled();
						expect(storageService.retrieve).toHaveBeenCalledOnceWith(key);

						done();
					},
					complete: () => fail(),
				});
			});

			it('should skip if cache is expired', (done) => {
				onLine.and.returnValue(false);

				configuration.includeServerOff = true;

				const request = new HttpRequest('GET', '//www.test.com');
				const err = new HttpErrorResponse({});
				const key = generateHttpRequestKey(request);
				const updatedAt = new Date().getTime() - configuration.maxAge * 60 * 60 * 1000 - 1;
				const createdAt = updatedAt;

				storageService.retrieve.and.resolveTo({ updatedAt, createdAt, value: {} });

				service.handleError(request, err).subscribe({
					next: () => fail(),
					error: (error) => {
						expect(error).toBe(err);
						expect(storageService.delete).toHaveBeenCalledOnceWith(key);
						expect(storageService.retrieve).toHaveBeenCalledOnceWith(key);

						done();
					},
					complete: () => fail(),
				});
			});
		});

		describe('get cache', () => {
			let request: HttpRequest<unknown>;
			let key: string;
			let expectedValue: HttpResponse<unknown>;
			let value: ConstructorParameters<typeof HttpResponse>[0];
			let createdAt: number;
			let updatedAt: number;

			beforeEach(() => {
				request = new HttpRequest('GET', '//www.test.com');
				key = generateHttpRequestKey(request);
				value = { status: 200, statusText: 'OK', url: '//www.test.com', body: {} };
				expectedValue = new HttpResponse(value);
				updatedAt = new Date().getTime() - (configuration.maxAge * 60 * 60 * 1000) / 2;
				createdAt = updatedAt;
			});

			beforeEach(() => {
				storageService.retrieve.and.resolveTo({ updatedAt, createdAt, value });
			});

			it('should get cache if onLine=false', (done) => {
				onLine.and.returnValue(false);

				const err = new HttpErrorResponse({ status: 0 });

				service.handleError(request, err).subscribe({
					next: (data) => expect(data).toEqual(expectedValue),
					error: () => fail(),
					complete: () => {
						expect(logService.write).toHaveBeenCalledOnceWith(
							stringMatching(/^Original request to .+ replaced with static cache!$/),
						);
						expect(storageService.retrieve).toHaveBeenCalledOnceWith(key);
						expect(storageService.delete).not.toHaveBeenCalled();

						done();
					},
				});
			});

			it('should get cache if onLine=true AND includeServerOff=true AND errorStatus=525', (done) => {
				onLine.and.returnValue(true);

				configuration.includeServerOff = true;

				const err = new HttpErrorResponse({ status: 525 });

				service.handleError(request, err).subscribe({
					next: (data) => expect(data).toEqual(expectedValue),
					error: () => fail(),
					complete: () => {
						expect(logService.write).toHaveBeenCalledOnceWith(
							stringMatching(/^Original request to .+ replaced with static cache!$/),
						);
						expect(storageService.retrieve).toHaveBeenCalledOnceWith(key);
						expect(storageService.delete).not.toHaveBeenCalled();

						done();
					},
				});
			});
		});
	});
});
