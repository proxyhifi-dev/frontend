import { TestBed } from '@angular/core/testing';

import { Position } from './position';

describe('Position', () => {
  let service: Position;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Position);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
