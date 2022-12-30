import { IndexedDbStorageService } from './indexed-db-storage.service';
import { storageServiceFactory } from './storage.service.factory';

describe('storageServiceFactory', () => {
	it('should be created', () => {
		const result = storageServiceFactory('db-name', 1);

		expect(result).toBeInstanceOf(IndexedDbStorageService);
	});
});
