import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Provider } from '@angular/core';

import { Configuration } from './api';
import { defaultConfiguration } from './config';
import { OfflineInterceptor } from './interceptors';
import { LogService, StorageService, storageServiceFactory } from './services';
import { CONFIGURATION, DB_NAME, DB_VERSION } from './tokens';

/**
 * Creates additional providers for offline network.
 *
 *
 * @example ```typescript
 * import { HTTP_INTERCEPTORS } from '@angular/common/http';
 * import { configureOfflineNetwork } from '@planess/offline-network';
 * import { environment } from 'src/environments/environment';
 *
 * ;@NgModule({
 *   providers: [
 *     configureOfflineNetwork(HTTP_INTERCEPTORS, environment.production)
 *   ]
 * })
 * export class AppModule {}
 * ```
 * @param HTTP_INTERCEPTORS_FROM_THE_APP Interceptor token from the application.
 * @param productionMode indicator of production environment. By default it's **true**!
 * @returns {Provider[]} Special providers for offline network.
 */
export function configureOfflineNetwork(
	HTTP_INTERCEPTORS_FROM_THE_APP: typeof HTTP_INTERCEPTORS,
	productionMode: boolean,
): Provider[];

/**
 * Creates additional providers for offline network.
 *
 *
 * @example ```typescript
 * import { HTTP_INTERCEPTORS } from '@angular/common/http';
 * import { configureOfflineNetwork } from '@planess/offline-network';
 * import { environment } from 'src/environments/environment';
 *
 * ;@NgModule({
 *   providers: [
 *     configureOfflineNetwork(HTTP_INTERCEPTORS, { maxAge: 60 }, environment.production)
 *   ]
 * })
 * export class AppModule {}
 * ```
 * @param HTTP_INTERCEPTORS_FROM_THE_APP Interceptor token from the application.
 * @param configuration Service configuration.
 * @param productionMode indicator of production environment. By default it's **true**!
 * @returns {Provider[]} Special providers for offline network.
 */
export function configureOfflineNetwork(
	HTTP_INTERCEPTORS_FROM_THE_APP: typeof HTTP_INTERCEPTORS,
	configuration: Partial<Configuration>,
	productionMode: boolean,
): Provider[];

/**
 * ...implementation
 */
export function configureOfflineNetwork(
	HTTP_INTERCEPTORS_FROM_THE_APP: typeof HTTP_INTERCEPTORS,
	configuration?: Partial<Configuration> | boolean,
	productionMode = true,
): Provider[] {
	if (typeof configuration === 'boolean') {
		productionMode = configuration;
		configuration = {};
	}

	if (productionMode) {
		return [];
	}

	LogService.write('Service is running!');

	configuration = { ...defaultConfiguration, ...configuration };

	return [
		{ provide: CONFIGURATION, useValue: configuration },
		{ provide: DB_VERSION, useValue: 1 },
		{ provide: DB_NAME, useValue: 'offline-network-db' },
		{
			provide: StorageService,
			useFactory: storageServiceFactory,
			deps: [DB_NAME, DB_VERSION, LogService],
		},
		{
			provide: HTTP_INTERCEPTORS_FROM_THE_APP,
			multi: true,
			useClass: OfflineInterceptor,
		},
	];
}
