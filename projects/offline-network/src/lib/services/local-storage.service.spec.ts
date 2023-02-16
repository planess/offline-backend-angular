import { TestBed } from '@angular/core/testing';

import { StorageData } from '../api';
import { DB_NAME, DB_VERSION } from '../tokens';

import { LocalStorageService } from './local-storage.service';
import { LogService } from './log.service';

import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import clock = jasmine.clock;
import Spy = jasmine.Spy;
import stringMatching = jasmine.stringMatching;

describe('LocalStorageService', () => {
	let service: LocalStorageService;
	let dbName: string;
	let dbVersion: number;
	let logService: SpyObj<LogService>;

	beforeEach(() => {
		dbName = 'test-db-name';
		dbVersion = 3;
		logService = createSpyObj<LogService>('LogService', ['write', 'alarm']);

		TestBed.configureTestingModule({
			providers: [
				{ provide: DB_NAME, useValue: dbName },
				{ provide: DB_VERSION, useValue: dbVersion },
				{ provide: LogService, useValue: logService },
			],
		});
		service = TestBed.inject(LocalStorageService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should delete', async () => {
		const remoteItem = spyOn(localStorage, 'removeItem');
		const key = 'delete-key';

		const result = service.delete(key);

		await expectAsync(result).toBeResolvedTo(undefined);
		expect(remoteItem).toHaveBeenCalledTimes(1);
		expect(remoteItem).toHaveBeenCalledWith(`${dbName}.${dbVersion}.${key}`);
	});

	describe('retrieve', () => {
		let getItem: Spy;
		let key: string;
		let storageKey: string;

		beforeEach(() => {
			key = 'retrieve-key';
			storageKey = `${dbName}.${dbVersion}.${key}`;

			getItem = spyOn(localStorage, 'getItem');
		});

		it('should be NULL', async () => {
			const result = service.retrieve(key);

			await expectAsync(result).toBeResolvedTo(null);
			expect(getItem).toHaveBeenCalledTimes(1);
			expect(getItem).toHaveBeenCalledWith(storageKey);
		});

		it('should get correct data', async () => {
			const data: StorageData<object> = { createdAt: 1, updatedAt: 2, value: {} };
			const serialized = JSON.stringify(data);

			getItem.and.returnValue(serialized);

			const result = service.retrieve(key);

			await expectAsync(result).toBeResolvedTo(data);
			expect(getItem).toHaveBeenCalledTimes(1);
			expect(getItem).toHaveBeenCalledWith(storageKey);
		});

		it('should get NULL due to wrong data', async () => {
			const deleteMethod = spyOn(service, 'delete');

			getItem.and.returnValue('{"status: OK"}');

			const result = service.retrieve(key);

			await expectAsync(result).toBeResolvedTo(null);
			expect(getItem).toHaveBeenCalledTimes(1);
			expect(getItem).toHaveBeenCalledWith(storageKey);
			expect(deleteMethod).toHaveBeenCalledTimes(1);
			expect(deleteMethod).toHaveBeenCalledWith(key);
			expect(logService.alarm).toHaveBeenCalledTimes(1);
			expect(logService.alarm).toHaveBeenCalledWith(
				stringMatching(/^Cache for .+ key is broken!$/),
			);
		});
	});

	describe('persist', () => {
		let deleteMethod: Spy;
		let retrieveMethod: Spy;
		let setItem: Spy;
		let key: string;
		let storageKey: string;

		beforeEach(() => {
			key = 'persist-key';
			storageKey = `${dbName}.${dbVersion}.${key}`;

			deleteMethod = spyOn(service, 'delete');
			retrieveMethod = spyOn(service, 'retrieve');

			setItem = spyOn(localStorage, 'setItem');
		});

		it('should only delete', async () => {
			deleteMethod.and.resolveTo();

			const result = service.persist(key, null);

			await expectAsync(result).toBeResolvedTo(undefined);
			expect(deleteMethod).toHaveBeenCalledTimes(1);
			expect(deleteMethod).toHaveBeenCalledWith(key);
		});

		it('should throw an error', async () => {
			const data = {};

			retrieveMethod.and.returnValue(null);
			setItem.and.throwError(new Error());

			const result = service.persist(key, data);

			await expectAsync(result).toBeRejected();
		});

		it('should persist new value', async () => {
			const data = { value: '1' };

			clock().mockDate(new Date());

			retrieveMethod.and.resolveTo(null);

			const value = JSON.stringify({
				createdAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
				value: data,
			});
			const result = service.persist(key, data);

			await expectAsync(result).toBeResolvedTo(undefined);
			expect(setItem).toHaveBeenCalledTimes(1);
			expect(setItem).toHaveBeenCalledWith(storageKey, value);
			expect(deleteMethod).not.toHaveBeenCalled();
		});

		it('should update data', async () => {
			const dataBefore = { value: '1' };
			const dayBefore = new Date().getTime() - 24 * 60 * 60 * 1000;
			const data = { value: '2' };

			clock().mockDate(new Date());

			retrieveMethod.and.resolveTo({
				createdAt: dayBefore,
				updatedAt: dayBefore,
				value: dataBefore,
			});

			const value = JSON.stringify({
				createdAt: dayBefore,
				updatedAt: new Date().getTime(),
				value: data,
			});
			const result = service.persist(key, data);

			await expectAsync(result).toBeResolvedTo(undefined);
			expect(setItem).toHaveBeenCalledTimes(1);
			expect(setItem).toHaveBeenCalledWith(storageKey, value);
			expect(deleteMethod).not.toHaveBeenCalled();
		});
	});
});
