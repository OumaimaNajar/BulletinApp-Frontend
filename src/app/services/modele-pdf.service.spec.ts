import { TestBed } from '@angular/core/testing';

import { ModelePdfService } from './modele-pdf.service';

describe('ModelePdfService', () => {
  let service: ModelePdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelePdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
