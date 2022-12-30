import { TestBed } from '@angular/core/testing';

import { OfflineNetworkService } from '../services';

import { OfflineInterceptor } from './offline.interceptor';

import createSpyObj = jasmine.createSpyObj;

describe('OfflineInterceptor', () => {
	let interceptor: OfflineInterceptor;
	let offlineNetworkService: OfflineNetworkService;

	beforeEach(() => {
		offlineNetworkService = createSpyObj('OfflineNetworkService', [
			'collectResponse',
			'handleError',
		]);

		TestBed.configureTestingModule({
			providers: [
				OfflineInterceptor,
				{ provide: OfflineNetworkService, useValue: offlineNetworkService },
			],
		});
	});

	beforeEach(() => {
		interceptor = TestBed.inject(OfflineInterceptor);
	});

	it('should be created', () => {
		expect(interceptor).toBeTruthy();
	});
});
