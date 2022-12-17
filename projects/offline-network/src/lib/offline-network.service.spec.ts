import { TestBed } from '@angular/core/testing';

import { OfflineNetworkService } from './offline-network.service';

describe('OfflineNetworkService', () => {
  let service: OfflineNetworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfflineNetworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
