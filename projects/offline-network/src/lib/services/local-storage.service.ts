import { Inject, Injectable, OnDestroy } from '@angular/core';

import { StorageApi, StorageData } from '../api';
import { DB_NAME, DB_VERSION } from '../tokens';

import { LogService } from './log.service';

@Injectable({
	providedIn: 'root',
})
export class LocalStorageService implements StorageApi, OnDestroy {
	constructor(
		@Inject(DB_NAME) private readonly db_name: string,
		@Inject(DB_VERSION) private readonly db_version: number,
		private readonly logService: LogService,
	) {}

	ngOnDestroy(): void {
		// do nothing
	}

	async retrieve<T>(key: string): Promise<StorageData<T> | null> {
		const storageKey = this.getStorageKey(key);
		const data = localStorage.getItem(storageKey);

		if (data) {
			try {
				return JSON.parse(data);
			} catch {
				// cache is broken for some reason
				this.logService.alarm(`Cache for ${key} key is broken!`);

				await this.delete(key);
			}
		}

		return null;
	}

	async persist<R>(key: string, data: R): Promise<void> {
		const storageKey = this.getStorageKey(key);

		if (!data) {
			return this.delete(key);
		}

		const restoredData = await this.retrieve(key);
		const updatedAt = new Date().getTime();
		let storageData: StorageData<R>;

		if (restoredData) {
			storageData = { ...restoredData, updatedAt, value: data };
		} else {
			const createdAt = new Date().getTime();

			storageData = { createdAt, updatedAt, value: data };
		}

		const value = JSON.stringify(storageData);

		localStorage.setItem(storageKey, value);
	}

	async delete(key: string): Promise<void> {
		const storageKey = this.getStorageKey(key);

		localStorage.removeItem(storageKey);
	}

	protected getStorageKey(key: string): string {
		return `${this.db_name}.${this.db_version}.${key}`;
	}
}
