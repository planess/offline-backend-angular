import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Provider } from '@angular/core';

import { Configuration } from './api';
import { defaultConfiguration } from './config';
import { OfflineInterceptor } from './interceptors';
import { StorageService, storageServiceFactory } from './services';
import { CONFIGURATION, DB_NAME, DB_VERSION } from './tokens';

/**
 * Creates additional providers for offline network.
 *
 *
 * @example ```typescript
 * import { HTTP_INTERCEPTORS } from '@angular/common/http';
 * import { configureOfflineNetwork } from 'offline-network';
 *
 * ;@NgModule({
 *   providers: [
 *     configureOfflineNetwork(HTTP_INTERCEPTORS, { maxAge: 60 })
 *   ]
 * })
 * export class AppModule {}
 * ```
 * @param HTTP_INTERCEPTORS_FROM_THE_APP Interceptor token from the application.
 * @param configuration Service configuration.
 * @returns {Provider[]} Special providers for offline network.
 */
export function configureOfflineNetwork(
	HTTP_INTERCEPTORS_FROM_THE_APP: typeof HTTP_INTERCEPTORS,
	configuration?: Partial<Configuration>,
): Provider[] {
	console.warn('Offline Network Service is enabled!');

	return [
		{ provide: CONFIGURATION, useValue: { ...defaultConfiguration, ...(configuration ?? {}) } },
		{ provide: DB_VERSION, useValue: 1 },
		{ provide: DB_NAME, useValue: 'offline-network-db' },
		{ provide: StorageService, useFactory: storageServiceFactory, deps: [DB_NAME, DB_VERSION] },
		{
			provide: HTTP_INTERCEPTORS_FROM_THE_APP,
			multi: true,
			useClass: OfflineInterceptor,
		},
	];
}
