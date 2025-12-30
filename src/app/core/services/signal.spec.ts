import { TestBed } from '@angular/core/testing';

import { Signal } from './signal';

describe('Signal', () => {
  let service: Signal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Signal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
