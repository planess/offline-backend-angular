import { Injectable, OnDestroy } from '@angular/core';

import { StorageApi, StorageData } from '../api';

import { IndexedDbStorageService } from './indexed-db-storage.service';
import { LogService } from './log.service';

@Injectable({
	providedIn: 'root',
})
export abstract class StorageService implements StorageApi, OnDestroy {
	protected constructor(private readonly log: LogService) {
		this.log.alarm(
			`Explicit instance of ${StorageService.name} cause errors. Use ${IndexedDbStorageService.name} in the provider!`,
		);
	}

	abstract ngOnDestroy(): void;

	abstract retrieve<T>(key: string): Promise<StorageData<T> | null>;

	abstract persist<R>(key: string, data: R): Promise<void>;

	abstract delete(key: string): Promise<void>;
}
