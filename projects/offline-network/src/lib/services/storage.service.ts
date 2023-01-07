import { Injectable, OnDestroy } from '@angular/core';

import { StorageApi } from '../api';

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

	abstract retrieve<T extends string | object>(key: string): Promise<T | null>;

	abstract persist<T extends string | number | object | null>(
		key: string,
		data: T,
	): Promise<boolean>;
}
