import { TestBed } from '@angular/core/testing';

import { GeofenceFmService } from './geofence-fm.service';

describe('GeofenceFmService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GeofenceFmService = TestBed.get(GeofenceFmService);
    expect(service).toBeTruthy();
  });
});
