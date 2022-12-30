import { Inject, Injectable } from '@angular/core';

import { StorageApi } from '../api';
import { DB_NAME, DB_VERSION } from '../tokens';

@Injectable({
	providedIn: 'root',
})
export class LocalStorageService implements StorageApi {
	constructor(
		@Inject(DB_NAME) private readonly db_name: string,
		@Inject(DB_VERSION) private readonly db_version: number,
	) {}

	ngOnDestroy(): void {
		// do nothing
	}

	async retrieve<T extends string | object>(key: string): Promise<T | null> {
		try {
			const k = `${this.db_name}.${this.db_version}.${key}`;
			const data = localStorage.getItem(k);

			if (typeof data === 'string') {
				let value;

				try {
					value = JSON.parse(data);
				} catch {
					value = data;
				}

				return value;
			} else {
				return data;
			}
		} catch {
			// do nothing
			return null;
		}
	}

	async persist<T>(key: string, data: T): Promise<boolean> {
		const k = `${this.db_name}.${this.db_version}.${key}`;

		if (data === undefined || data === null) {
			try {
				localStorage.removeItem(k);

				return true;
			} catch {
				return false;
			}
		}

		let value: string;

		if (typeof data === 'string') {
			value = data;
		} else if (typeof data === 'number') {
			value = `${data}`;
		} else if (typeof data === 'object') {
			try {
				value = JSON.stringify(data);
			} catch {
				throw new Error('Some wrong data');
			}
		} else {
			throw new Error('Some wrong data');
		}

		try {
			localStorage.setItem(k, value);

			return true;
		} catch {
			return false;
		}
	}
}
