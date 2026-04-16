import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { HostStationsComponent } from './host-stations.component';
import { TransportService } from '../../../../tourist/services/transport.service';

describe('HostStationsComponent', () => {
  let component: HostStationsComponent;
  let fixture: ComponentFixture<HostStationsComponent>;
  let transportServiceSpy: jasmine.SpyObj<TransportService>;

  beforeEach(async () => {
    transportServiceSpy = jasmine.createSpyObj<TransportService>('TransportService', [
      'getStations',
      'geocodeLocation',
      'reverseGeocodeLocation',
      'createStation',
      'updateStation',
      'deleteStation'
    ]);

    transportServiceSpy.getStations.and.returnValue(of([
      {
        id: 1,
        name: 'Lac',
        city: 'Tunis',
        surcharge: 0,
        downtown: true,
        latitude: 36.838,
        longitude: 10.274
      }
    ]));
    transportServiceSpy.geocodeLocation.and.returnValue(of([]));
    transportServiceSpy.reverseGeocodeLocation.and.returnValue(of({
      name: 'Lac',
      city: 'Tunis',
      displayName: 'Lac, Tunis, Tunisie',
      latitude: 36.838,
      longitude: 10.274
    }));

    await TestBed.configureTestingModule({
      declarations: [HostStationsComponent],
      imports: [FormsModule, ReactiveFormsModule],
      providers: [{ provide: TransportService, useValue: transportServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HostStationsComponent);
    component = fixture.componentInstance;
  });

  it('should fill station coordinates and city when the user clicks on the Tunisia map', () => {
    component.ngOnInit();

    component.onMapCoordinateSelected({ lat: 36.838, lng: 10.274 });

    expect(component.stationForm.get('latitude')?.value).toBe(36.838);
    expect(component.stationForm.get('longitude')?.value).toBe(10.274);
    expect(component.stationForm.get('city')?.value).toBe('Tunis');
    expect(component.stationForm.get('name')?.value).toBe('Lac');
  });

  it('should update name and city when the user selects another place on the map', () => {
    transportServiceSpy.reverseGeocodeLocation.and.callFake((latitude: number, longitude: number) => {
      if (latitude === 35.8256 && longitude === 10.6084) {
        return of({
          name: 'Sousse Medina',
          city: 'Sousse',
          displayName: 'Sousse Medina, Sousse, Tunisie',
          latitude,
          longitude
        });
      }

      return of({
        name: 'Lac',
        city: 'Tunis',
        displayName: 'Lac, Tunis, Tunisie',
        latitude,
        longitude
      });
    });

    component.ngOnInit();

    component.onMapCoordinateSelected({ lat: 36.838, lng: 10.274 });
    component.onMapCoordinateSelected({ lat: 35.8256, lng: 10.6084 });

    expect(component.stationForm.get('latitude')?.value).toBe(35.8256);
    expect(component.stationForm.get('longitude')?.value).toBe(10.6084);
    expect(component.stationForm.get('city')?.value).toBe('Sousse');
    expect(component.stationForm.get('name')?.value).toBe('Sousse Medina');
  });
});
