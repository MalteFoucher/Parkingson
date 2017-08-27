import { TestBed, inject } from '@angular/core/testing';

import { Store } from './store.service';

describe('Store', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Store]
    });
  });

  it('should be created', inject([Store], (service: Store) => {
    expect(service).toBeTruthy();
  }));
});
