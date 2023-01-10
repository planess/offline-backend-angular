import { TestBed } from '@angular/core/testing';

import { LogService } from './log.service';

describe('LogService', () => {
	let service: LogService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(LogService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should write text', () => {
		const warn = spyOn(console, 'warn');

		service.write('text');

		expect(warn).toHaveBeenCalledOnceWith('Offline Network: text');
	});

	it('should write error', () => {
		const error = spyOn(console, 'error');

		service.alarm('text');

		expect(error).toHaveBeenCalledOnceWith('Offline Network: text');
	});
});
