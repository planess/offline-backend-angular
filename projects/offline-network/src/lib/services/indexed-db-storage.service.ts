import { Inject, Injectable, OnDestroy } from '@angular/core';
import { from, of, ReplaySubject, Subject } from 'rxjs';
import { finalize, first, switchMap, takeUntil } from 'rxjs/operators';

import { StorageApi, StorageData } from '../api';
import { dbObjectStore } from '../config';
import { DB_NAME, DB_VERSION } from '../tokens';

import { LogService } from './log.service';

@Injectable({
	providedIn: 'root',
})
export class IndexedDbStorageService implements StorageApi, OnDestroy {
	protected db$ = new ReplaySubject<IDBDatabase>(1);
	protected dbClose$ = new Subject<void>();

	constructor(
		@Inject(DB_NAME) private readonly db_name: string,
		@Inject(DB_VERSION) private readonly db_version: number,
		private readonly logService: LogService,
	) {
		this.init();
	}

	delete(key: string): Promise<void> {
		return this.db$
			.pipe(
				first<IDBDatabase>(Boolean),
				switchMap(
					(db) =>
						new Promise<void>((resolve, reject) => {
							const request = db
								.transaction([dbObjectStore])
								.objectStore(dbObjectStore)
								.delete(key);

							request.onerror = reject;
							request.onsuccess = () => resolve();
						}),
				),
			)
			.toPromise();
	}

	retrieve<T>(key: string): Promise<StorageData<T> | null> {
		return this.db$
			.pipe(
				first<IDBDatabase>(Boolean),
				switchMap(
					(db) =>
						new Promise<StorageData<string>>((resolve, reject) => {
							const request = db.transaction([dbObjectStore]).objectStore(dbObjectStore).get(key);

							request.onerror = reject;
							request.onsuccess = () => {
								resolve(request.result ?? null);
							};
						}),
				),
				switchMap((data) => {
					if (data) {
						try {
							const value = JSON.parse(data.value);

							return of({ ...data, value });
						} catch {
							// cache is broken for some reason
							this.logService.alarm(`Cache for ${key} key is broken!`);

							return this.delete(key).then(() => null);
						}
					}

					return of(null);
				}),
			)
			.toPromise();
	}

	persist<T>(key: string, data: T): Promise<void> {
		if (!data) {
			return this.delete(key);
		}

		return this.db$
			.pipe(
				first<IDBDatabase>(Boolean),
				switchMap((db) =>
					from(this.retrieve(key)).pipe(
						switchMap((value) => {
							const createdAt = new Date().getTime();
							const updatedAt = new Date().getTime();
							const transaction = db.transaction([dbObjectStore], 'readwrite');

							return new Promise<void>((resolve, reject) => {
								const serializedData = JSON.stringify(data);

								let storageData: StorageData<string>;

								if (value) {
									storageData = { ...value, updatedAt, value: serializedData };
								} else {
									storageData = { createdAt, updatedAt, value: serializedData, key };
								}

								transaction.onerror = reject;
								transaction.oncomplete = () => resolve();

								transaction.objectStore(dbObjectStore).put(storageData);
							});
						}),
					),
				),
			)
			.toPromise();
	}

	ngOnDestroy(): void {
		this.dbClose$.next();
	}

	protected init(): void {
		const openDBRequest = indexedDB.open(this.db_name, this.db_version);
		let db: IDBDatabase;

		openDBRequest.onerror = (ev) => {
			this.db$.error(ev);
		};
		openDBRequest.onsuccess = () => {
			db = openDBRequest.result;

			this.db$.next(openDBRequest.result);
		};
		openDBRequest.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			const objectStore = db.createObjectStore(dbObjectStore, { keyPath: 'key' });
			objectStore.createIndex('createdAt', 'createdAt', { unique: false });
			objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
		};

		this.db$
			.pipe(
				takeUntil(this.dbClose$),
				finalize(() => {
					db?.close();
				}),
			)
			.subscribe({
				error: (ev) => {
					this.logService.alarm(`IndexedDB is unavailable for some reason: ${ev}`);
				},
			});
	}
}
