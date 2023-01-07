import { IndexedDbStorageService } from './indexed-db-storage.service';
import { LocalStorageService } from './local-storage.service';
import { storageServiceFactory } from './storage.service.factory';

describe('storageServiceFactory', () => {
	it('should IndexedDBService be created', () => {
		const result = storageServiceFactory('db-name', 1);

		expect(result).toBeInstanceOf(IndexedDbStorageService);
	});

	it('should LocalStorage be created', () => {
		spyOnProperty(window, 'indexedDB').and.returnValue(undefined);

		const result = storageServiceFactory('db-name', 1);

		expect(result).toBeInstanceOf(LocalStorageService);
	});
});
