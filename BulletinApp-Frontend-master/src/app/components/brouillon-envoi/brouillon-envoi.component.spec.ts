import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrouillonEnvoiComponent } from './brouillon-envoi.component';

describe('BrouillonEnvoiComponent', () => {
  let component: BrouillonEnvoiComponent;
  let fixture: ComponentFixture<BrouillonEnvoiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrouillonEnvoiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrouillonEnvoiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
