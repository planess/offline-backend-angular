import { StorageApi } from '../api';

import { IndexedDbStorageService } from './indexed-db-storage.service';
import { LocalStorageService } from './local-storage.service';
import { LogService } from './log.service';

export function storageServiceFactory(
	db_name: string,
	db_version: number,
	logService: LogService,
): StorageApi {
	if (indexedDB) {
		return new IndexedDbStorageService(db_name, db_version, logService);
	} else if (localStorage) {
		return new LocalStorageService(db_name, db_version, logService);
	}

	throw new Error('No one data service is available.');
}
