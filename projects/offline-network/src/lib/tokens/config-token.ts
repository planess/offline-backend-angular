import { InjectionToken } from '@angular/core';

import { Configuration } from '../api';

/**
 * Injectable Configuration token.
 */
export const CONFIGURATION = new InjectionToken<Configuration>('configuration');
