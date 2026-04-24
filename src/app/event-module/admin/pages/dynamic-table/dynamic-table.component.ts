import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

export interface TableColumn {
  header: string;
  key: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  cellRenderer?: (value: any, row: any) => string;
}

export interface TableAction {
  label: string;
  icon?: string;
  class?: string;
  action: (row: any) => void;
  disabled?: (row: any) => boolean;
}

export interface TableFilter {
  key: string;
  placeholder: string;
  type: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
}

@Component({
  selector: 'app-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.css'
})
export class DynamicTableComponent implements OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableAction[] = [];
  @Input() filters: TableFilter[] = [];
  @Input() pageSize: number = 10;
  @Input() showPagination: boolean = true;
  @Input() showSearch: boolean = true;
  @Input() loading: boolean = false;
  @Input() emptyMessage: string = 'No data available';

  @Output() actionClick = new EventEmitter<{ action: TableAction; row: any }>();
  @Output() filterChange = new EventEmitter<any>();

  filteredData: any[] = [];
  paginatedData: any[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  searchQuery: string = '';
  activeFilters: { [key: string]: any } = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['filters']) {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    let filtered = [...this.data];

    // Apply search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(row => {
        return this.columns.some(col => {
          const value = row[col.key];
          return value && value.toString().toLowerCase().includes(query);
        });
      });
    }

    // Apply active filters
    Object.keys(this.activeFilters).forEach(key => {
      const filterValue = this.activeFilters[key];
      if (filterValue && filterValue !== '' && filterValue !== 'All') {
        filtered = filtered.filter(row => {
          const value = row[key];
          return value && value.toString() === filterValue.toString();
        });
      }
    });

    this.filteredData = filtered;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.currentPage = 1;
    this.paginate();
  }

  paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginate();
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(key: string, value: any): void {
    this.activeFilters[key] = value;
    this.applyFilters();
    this.filterChange.emit(this.activeFilters);
  }

  onActionClick(action: TableAction, row: any, event: Event): void {
    event.stopPropagation();
    this.actionClick.emit({ action, row });
  }

  sort(column: TableColumn): void {
    // Simple sort implementation
    if (!column.sortable) return;

    this.filteredData.sort((a, b) => {
      const valA = a[column.key];
      const valB = b[column.key];
      
      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });

    this.applyFilters();
  }

  get paginationRange(): number[] {
    const range: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  // Helper method for template (Math.min not accessible in template)
  getMinPageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredData.length);
  }
}
