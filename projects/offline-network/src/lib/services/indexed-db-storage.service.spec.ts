import { TestBed } from '@angular/core/testing';

import { StorageData } from '../api';
import { dbObjectStore } from '../config';
import { DB_NAME, DB_VERSION } from '../tokens';

import { IndexedDbStorageService } from './indexed-db-storage.service';
import { LogService } from './log.service';

import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import arrayWithExactContents = jasmine.arrayWithExactContents;
import clock = jasmine.clock;
import Spy = jasmine.Spy;
import stringMatching = jasmine.stringMatching;
import createSpy = jasmine.createSpy;

describe('IndexedDbStorageService', () => {
	let service: IndexedDbStorageService;
	let dbName: string;
	let dbVersion: number;
	let logService: SpyObj<LogService>;

	let openDBRequest: SpyObj<IDBOpenDBRequest>;
	let db: SpyObj<IDBDatabase>;
	let transaction: SpyObj<IDBTransaction>;
	let objectStore: SpyObj<IDBObjectStore>;

	beforeEach(() => {
		objectStore = createSpyObj('IDBObjectStore', ['delete', 'get', 'put', 'add']);
		transaction = createSpyObj('IDBTransaction', ['objectStore']);
		db = createSpyObj<IDBDatabase>('IDBDatabase', ['transaction', 'close', 'createObjectStore']);
		db.transaction.and.returnValue(transaction);
		db.createObjectStore.and.returnValue({ createIndex: createSpy() } as unknown as IDBObjectStore);
		transaction.objectStore.and.returnValue(objectStore);

		openDBRequest = createSpyObj<IDBOpenDBRequest>('IDBOpenDBRequest', ['onsuccess', 'onerror'], {
			result: db,
		});

		spyOn(indexedDB, 'open').and.callFake(() => {
			setTimeout(() => {
				openDBRequest?.onupgradeneeded?.({
					oldVersion: 2,
					newVersion: 3,
					target: { result: db },
				} as unknown as IDBVersionChangeEvent);
				openDBRequest?.onsuccess?.(new Event(''));
			});

			return openDBRequest;
		});
	});

	beforeEach(() => {
		dbName = 'test-db-name';
		dbVersion = 2;
		logService = createSpyObj('LogService', ['alarm', 'write']);

		TestBed.configureTestingModule({
			providers: [
				{ provide: DB_NAME, useValue: dbName },
				{ provide: DB_VERSION, useValue: dbVersion },
				{ provide: LogService, useValue: logService },
			],
		});

		service = TestBed.inject(IndexedDbStorageService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should break on initialization', () => {
		openDBRequest?.onerror?.(new Event(''));

		expect(logService.alarm).toHaveBeenCalledTimes(1);
		expect(logService.alarm).toHaveBeenCalledWith(
			stringMatching(/^IndexedDB is unavailable for some reason:/),
		);
	});

	it('should delete', async () => {
		const key = 'delete-key';
		const deleteRequest = createSpyObj<IDBRequest>('IDBRequest', ['onerror', 'onsuccess']);

		objectStore.delete.and.callFake(() => {
			setTimeout(() => {
				deleteRequest?.onsuccess?.(new Event(''));
			});

			return deleteRequest;
		});

		const result = service.delete(key);

		await expectAsync(result).toBeResolvedTo();
		expect(db.transaction).toHaveBeenCalledTimes(1);
		expect(db.transaction).toHaveBeenCalledWith(arrayWithExactContents([dbObjectStore]));
		expect(transaction.objectStore).toHaveBeenCalledTimes(1);
		expect(transaction.objectStore).toHaveBeenCalledWith(dbObjectStore);
		expect(objectStore.delete).toHaveBeenCalledTimes(1);
		expect(objectStore.delete).toHaveBeenCalledWith(key);
	});

	describe('retrieve', () => {
		let key: string;

		beforeEach(() => {
			key = 'retrieve-key';
		});

		it('should be NULL', async () => {
			const getRequest = createSpyObj('IDBRequest', ['onerror', 'onsuccess']);

			objectStore.get.and.callFake(() => {
				setTimeout(() => {
					getRequest.onsuccess();
				});

				return getRequest;
			});
			const result = service.retrieve(key);

			await expectAsync(result).toBeResolvedTo(null);
			expect(objectStore.get).toHaveBeenCalledTimes(1);
			expect(objectStore.get).toHaveBeenCalledWith(key);
		});

		it('should get correct data', async () => {
			clock().mockDate(new Date());

			const data: StorageData<unknown> = {
				createdAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
				value: { status: 500 },
			};
			const serialized = { ...data, value: JSON.stringify(data.value) };
			const getRequest = createSpyObj('IDBRequest', ['onerror', 'onsuccess'], {
				result: serialized,
			});

			objectStore.get.and.callFake(() => {
				setTimeout(() => {
					getRequest.onsuccess();
				});

				return getRequest;
			});
			const result = service.retrieve(key);

			await expectAsync(result).toBeResolvedTo(data);
			expect(objectStore.get).toHaveBeenCalledTimes(1);
			expect(objectStore.get).toHaveBeenCalledWith(key);
		});

		it('should get NULL due to wrong data', async () => {
			const deleteMethod = spyOn(service, 'delete').and.returnValue(Promise.resolve());
			const data = {
				createdAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
				value: '{"status: OK"}',
			};
			const getRequest = createSpyObj('IDBRequest', ['onerror', 'onsuccess'], { result: data });

			objectStore.get.and.callFake(() => {
				setTimeout(() => {
					getRequest.onsuccess();
				});

				return getRequest;
			});
			const result = service.retrieve(key);

			await expectAsync(result).toBeResolvedTo(null);
			expect(deleteMethod).toHaveBeenCalledTimes(1);
			expect(deleteMethod).toHaveBeenCalledWith(key);
			expect(objectStore.get).toHaveBeenCalledTimes(1);
			expect(objectStore.get).toHaveBeenCalledWith(key);
		});
	});

	describe('persist', () => {
		let key: string;
		let retrieveMethod: Spy;

		beforeEach(() => {
			key = 'persist-key';

			retrieveMethod = spyOn(service, 'retrieve');
		});

		it('should only delete', async () => {
			const deleteMethod = spyOn(service, 'delete').and.returnValue(Promise.resolve());

			const result = service.persist(key, null);

			await expectAsync(result).toBeResolvedTo();
			expect(deleteMethod).toHaveBeenCalledTimes(1);
			expect(deleteMethod).toHaveBeenCalledWith(key);
		});

		it('should throw an error', async () => {
			clock().mockDate(new Date());

			const data = { status: 505 };
			const serialized = {
				key,
				createdAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
				value: JSON.stringify(data),
			};

			retrieveMethod.and.returnValue(Promise.resolve(null));
			objectStore.put.and.throwError(new Error());

			const result = service.persist(key, data);

			await expectAsync(result).toBeRejected();
			expect(retrieveMethod).toHaveBeenCalledTimes(1);
			expect(retrieveMethod).toHaveBeenCalledWith(key);
			expect(objectStore.put).toHaveBeenCalledTimes(1);
			expect(objectStore.put).toHaveBeenCalledWith(serialized);
		});

		it('should persist new value', async () => {
			clock().mockDate(new Date());

			const data = { status: 505 };
			const serialized = {
				key,
				createdAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
				value: JSON.stringify(data),
			};

			retrieveMethod.and.returnValue(Promise.resolve(null));

			objectStore.put.and.callFake(() => {
				setTimeout(() => {
					transaction?.oncomplete?.(new Event(''));
				});

				return createSpyObj('IDBRequest', ['onerror']);
			});

			const result = service.persist(key, data);

			await expectAsync(result).toBeResolvedTo(undefined);
			expect(retrieveMethod).toHaveBeenCalledTimes(1);
			expect(retrieveMethod).toHaveBeenCalledWith(key);
			expect(objectStore.put).toHaveBeenCalledTimes(1);
			expect(objectStore.put).toHaveBeenCalledWith(serialized);
			expect(db.transaction).toHaveBeenCalledTimes(1);
			expect(db.transaction).toHaveBeenCalledWith(
				arrayWithExactContents([dbObjectStore]),
				'readwrite',
			);
		});

		it('should update data', async () => {
			clock().mockDate(new Date());

			const dataBefore = { value: '4' };
			const dayBefore = new Date().getTime() - 24 * 60 * 60 * 1000;
			const data = { value: '5' };
			const serialized = {
				key,
				createdAt: dayBefore,
				updatedAt: new Date().getTime(),
				value: JSON.stringify(data),
			};

			retrieveMethod.and.returnValue(
				Promise.resolve({ key, createdAt: dayBefore, updatedAt: dayBefore, value: dataBefore }),
			);

			objectStore.put.and.callFake(() => {
				setTimeout(() => {
					transaction?.oncomplete?.(new Event(''));
				});

				return createSpyObj('IDBRequest', ['onerror']);
			});

			const result = service.persist(key, data);

			await expectAsync(result).toBeResolvedTo(undefined);
			expect(db.transaction).toHaveBeenCalledTimes(1);
			expect(db.transaction).toHaveBeenCalledWith(
				arrayWithExactContents([dbObjectStore]),
				'readwrite',
			);
			expect(objectStore.put).toHaveBeenCalledTimes(1);
			expect(objectStore.put).toHaveBeenCalledWith(serialized);
			expect(retrieveMethod).toHaveBeenCalledTimes(1);
			expect(retrieveMethod).toHaveBeenCalledWith(key);
		});
	});
});
