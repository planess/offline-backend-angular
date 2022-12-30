import { TestBed } from '@angular/core/testing';

import { DB_NAME, DB_VERSION } from '../tokens';

import { IndexedDbStorageService } from './indexed-db-storage.service';

describe('IndexedDbStorageService', () => {
	let service: IndexedDbStorageService;
	let dbName: string;
	let dbVersion: number;

	beforeEach(() => {
		dbName = 'test-db-name';
		dbVersion = 2;

		TestBed.configureTestingModule({
			providers: [
				{ provide: DB_NAME, useValue: dbName },
				{ provide: DB_VERSION, useValue: dbVersion },
			],
		});
		service = TestBed.inject(IndexedDbStorageService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
