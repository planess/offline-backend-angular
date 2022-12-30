import { TestBed } from '@angular/core/testing';

import { DB_NAME, DB_VERSION } from '../tokens';

import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
	let service: LocalStorageService;
	let dbName: string;
	let dbVersion: number;

	beforeEach(() => {
		dbName = 'test-db-name';
		dbVersion = 3;

		TestBed.configureTestingModule({
			providers: [
				{ provide: DB_NAME, useValue: dbName },
				{ provide: DB_VERSION, useValue: dbVersion },
			],
		});
		service = TestBed.inject(LocalStorageService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
