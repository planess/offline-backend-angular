import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class LogService {
	protected static prefix = 'Offline Network';

	static write(text: string): void {
		console.warn(`${LogService.prefix}: ${text}`);
	}

	write(text: string): void {
		LogService.write(text);
	}

	alarm(text: string): void {
		console.error(`${LogService.prefix}: ${text}`);
	}
}
