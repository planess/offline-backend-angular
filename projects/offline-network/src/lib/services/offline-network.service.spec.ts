import { TestBed } from '@angular/core/testing';

import { Configuration } from '../api';
import { CONFIGURATION } from '../tokens';

import { OfflineNetworkService } from './offline-network.service';
import { StorageService } from './storage.service';

import createSpyObj = jasmine.createSpyObj;

describe('OfflineNetworkService', () => {
	let service: OfflineNetworkService;
	let storageService: StorageService;
	let configuration: Configuration;

	beforeEach(() => {
		storageService = createSpyObj('StorageService', ['persist', 'retrieve']);
		configuration = { maxAge: 120, includeServerOff: true };

		TestBed.configureTestingModule({
			providers: [
				{ provide: CONFIGURATION, useValue: configuration },
				{ provide: StorageService, useValue: storageService },
			],
		});
		service = TestBed.inject(OfflineNetworkService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
