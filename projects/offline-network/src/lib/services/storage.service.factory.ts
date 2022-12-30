import { IndexedDbStorageService } from './indexed-db-storage.service';
import { LocalStorageService } from './local-storage.service';

export function storageServiceFactory(db_name: string, db_version: number) {
	if (indexedDB) {
		return new IndexedDbStorageService(db_name, db_version);
	} else {
		return new LocalStorageService(db_name, db_version);
	}
}
