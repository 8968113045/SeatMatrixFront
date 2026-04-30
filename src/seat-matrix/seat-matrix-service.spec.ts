import { TestBed } from '@angular/core/testing';

import { SeatMatrixService } from './seat-matrix-service';

describe('SeatMatrixService', () => {
  let service: SeatMatrixService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeatMatrixService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
