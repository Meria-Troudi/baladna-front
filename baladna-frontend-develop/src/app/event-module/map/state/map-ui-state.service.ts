import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapUiStateService {

  // selected item (click)
  private selectedSubject = new BehaviorSubject<any | null>(null);
  selected$ = this.selectedSubject.asObservable();

  // hovered item (mouse over)
  private hoveredSubject = new BehaviorSubject<any | null>(null);
  hovered$ = this.hoveredSubject.asObservable();

  // optional future: active filter set (prepare now for scaling)
  private filtersSubject = new BehaviorSubject<any>({});
  filters$ = this.filtersSubject.asObservable();

  setSelected(item: any | null): void {
    this.selectedSubject.next(item);
  }

  setHovered(item: any | null): void {
    this.hoveredSubject.next(item);
  }

  setFilters(filters: any): void {
    this.filtersSubject.next(filters);
  }

  resetSelection(): void {
    this.selectedSubject.next(null);
  }

  resetHover(): void {
    this.hoveredSubject.next(null);
  }
}