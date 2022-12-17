import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfflineNetworkComponent } from './offline-network.component';

describe('OfflineNetworkComponent', () => {
  let component: OfflineNetworkComponent;
  let fixture: ComponentFixture<OfflineNetworkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OfflineNetworkComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OfflineNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
