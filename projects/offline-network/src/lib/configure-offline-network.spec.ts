import { InjectionToken } from '@angular/core';

import { Configuration } from './api';
import { defaultConfiguration } from './config';
import { configureOfflineNetwork } from './configure-offline-network';
import { OfflineInterceptor } from './interceptors';
import { LogService, StorageService } from './services';
import { CONFIGURATION, DB_NAME, DB_VERSION } from './tokens';

import arrayWithExactContents = jasmine.arrayWithExactContents;
import any = jasmine.any;

describe('configureOfflineNetwork', () => {
	describe('for production mode', () => {
		it('should run without configuration', () => {
			const result = configureOfflineNetwork(new InjectionToken('-test'), true);

			expect(result).toEqual(arrayWithExactContents([]));
		});

		it('should provide empty list', () => {
			const result = configureOfflineNetwork(new InjectionToken('-test'), {}, true);

			expect(result).toEqual(arrayWithExactContents([]));
		});
	});

	describe('list of providers for development mode', () => {
		it('should set default providers', () => {
			const token = new InjectionToken('-test');
			const configuration = { ...defaultConfiguration };
			const result = configureOfflineNetwork(token, false);
			const expectedResult = [
				{ provide: CONFIGURATION, useValue: configuration },
				{ provide: DB_VERSION, useValue: any(Number) },
				{ provide: DB_NAME, useValue: any(String) },
				{
					provide: StorageService,
					useFactory: any(Function),
					deps: [DB_NAME, DB_VERSION, LogService],
				},
				{ provide: token, multi: true, useClass: OfflineInterceptor },
			];

			expect(result).toEqual(arrayWithExactContents(expectedResult));
		});

		it('should set providers', () => {
			const token = new InjectionToken('-test');
			const settings: Configuration = { maxAge: 60, includeServerOff: true };
			const configuration: Configuration = {
				...defaultConfiguration,
				maxAge: 60,
				includeServerOff: true,
			};
			const result = configureOfflineNetwork(token, settings, false);
			const expectedResult = [
				{ provide: CONFIGURATION, useValue: configuration },
				{ provide: DB_VERSION, useValue: any(Number) },
				{ provide: DB_NAME, useValue: any(String) },
				{
					provide: StorageService,
					useFactory: any(Function),
					deps: [DB_NAME, DB_VERSION, LogService],
				},
				{ provide: token, multi: true, useClass: OfflineInterceptor },
			];

			expect(result).toEqual(arrayWithExactContents(expectedResult));
		});
	});
});
