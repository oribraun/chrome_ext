import { TestBed } from '@angular/core/testing';

import { Auth.BasicGuard } from './auth.basic.guard';

describe('Auth.BasicGuard', () => {
  let guard: Auth.BasicGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(Auth.BasicGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
