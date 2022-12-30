import { Inject, Injectable } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { finalize, first, map, switchMap, takeUntil } from 'rxjs/operators';

import { StorageApi } from '../api';
import { dbObjectStore } from '../config';
import { DB_NAME, DB_VERSION } from '../tokens';

@Injectable({
	providedIn: 'root',
})
export class IndexedDbStorageService implements StorageApi {
	protected db$ = new ReplaySubject<IDBDatabase>(1);
	protected dbClose$ = new Subject<void>();

	constructor(
		@Inject(DB_NAME) private readonly db_name: string,
		@Inject(DB_VERSION) private readonly db_version: number,
	) {
		this.init();
	}

	retrieve<T>(key: string): Promise<T | null> {
		return this.db$
			.pipe(
				first<IDBDatabase>(Boolean),
				switchMap((db) => {
					return new Promise<T | null>((resolve, reject) => {
						const request = db.transaction([dbObjectStore]).objectStore(dbObjectStore).get(key);

						request.onerror = reject;
						request.onsuccess = () => {
							const data = request.result?.data ?? null;

							resolve(data);
						};
					});
				}),
				map((data) => {
					let d;

					if (data) {
						if (typeof data === 'string') {
							try {
								d = JSON.parse(data);
							} catch {
								d = data;
							}
						}
					} else {
						d = data ?? null;
					}

					return d;
				}),
			)
			.toPromise();
	}

	persist<T>(key: string, data: T): Promise<boolean> {
		return this.db$
			.pipe(
				first<IDBDatabase>(Boolean),
				switchMap((db) => {
					return new Promise<boolean>((resolve, reject) => {
						let d: string;

						switch (typeof data) {
						case 'string':
							d = data;
							break;
						case 'number':
							d = `${data}`;
							break;
						case 'object':
							d = JSON.stringify(data);
							break;
						default:
							throw new Error('Some wrong data');
						}

						const transaction = db.transaction(dbObjectStore, 'readwrite');
						const request = transaction.objectStore(dbObjectStore).put({ key, data: d });

						request.onerror = (err) => {
							console.log('-add error', err);
						};

						transaction.oncomplete = () => {
							resolve(true);
						};
						transaction.onerror = () => {
							resolve(false);
						};
					});
				}),
			)
			.toPromise();
	}

	ngOnDestroy(): void {
		this.dbClose$.next();
	}

	protected init(): void {
		const openDBRequest = indexedDB.open(this.db_name, this.db_version);
		let db: IDBDatabase;

		openDBRequest.onerror = (event) => {
			console.error('IndexedDB is unavailable for some reason!');

			this.db$.complete();
		};
		openDBRequest.onsuccess = (event) => {
			db = openDBRequest.result;

			this.db$.next(openDBRequest.result);
		};
		openDBRequest.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			db.createObjectStore(dbObjectStore, { keyPath: 'key' });
		};

		this.db$
			.pipe(
				takeUntil(this.dbClose$),
				finalize(() => {
					db?.close();
				}),
			)
			.subscribe();
	}
}
