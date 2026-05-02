import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenererEmlComponent } from './generer-eml.component';

describe('GenererEmlComponent', () => {
  let component: GenererEmlComponent;
  let fixture: ComponentFixture<GenererEmlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenererEmlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenererEmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
