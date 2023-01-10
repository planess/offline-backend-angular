import { IndexedDbStorageService } from './indexed-db-storage.service';
import { LocalStorageService } from './local-storage.service';
import { LogService } from './log.service';
import { storageServiceFactory } from './storage.service.factory';

import createSpyObj = jasmine.createSpyObj;

describe('storageServiceFactory', () => {
	let logService: LogService;

	beforeEach(() => {
		logService = createSpyObj<LogService>('LogService', ['alarm', 'write']);
	});

	it('should IndexedDBService be created', () => {
		const result = storageServiceFactory('db-name', 1, logService);

		expect(result).toBeInstanceOf(IndexedDbStorageService);
	});

	it('should LocalStorage be created', () => {
		spyOnProperty(window, 'indexedDB').and.returnValue(undefined);

		const result = storageServiceFactory('db-name', 1, logService);

		expect(result).toBeInstanceOf(LocalStorageService);
	});

	it('should error be thrown', () => {
		spyOnProperty(window, 'indexedDB').and.returnValue(undefined);
		spyOnProperty(window, 'localStorage').and.returnValue(undefined);

		expect(() => storageServiceFactory('-db-name', 1, logService)).toThrowError(
			'No one data service is available.',
		);
	});
});
