import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { AuthService } from '../../auth/services/auth.service';
import { User } from '../user.model';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  users: User[] = [];
  filteredUsers: User[] = [];
  stats: any = null;

  keyword = '';
  selectedRole = '';
  selectedStatus = '';
  showDeleted = false;
  loading = false;

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private userService: UserService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
  }

  loadUsers(): void {
    this.loading = true;

    const request = this.showDeleted
      ? this.userService.getAllUsersIncludingDeleted()
      : this.userService.getAllUsers();

    request.subscribe(users => {
      this.users = users;
      this.filteredUsers = users;
      this.applyFilters();
      this.loading = false;
    });
  }

  toggleShowDeleted(): void {
    this.showDeleted = !this.showDeleted;
    this.currentPage = 1;
    this.loadUsers();
  }

  loadStats(): void {
    this.userService.getUserStats().subscribe(stats => this.stats = stats);
  }

  search(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  filterByRole(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  filterByStatus(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.users];

    if (this.keyword.trim()) {
      const keyword = this.keyword.toLowerCase();
      result = result.filter(user =>
        user.firstName.toLowerCase().includes(keyword) ||
        user.lastName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    }

    if (this.selectedRole) {
      result = result.filter(user => user.role === this.selectedRole);
    }

    if (this.selectedStatus) {
      result = result.filter(user => user.status === this.selectedStatus);
    }

    this.filteredUsers = result;
    this.totalPages = Math.ceil(result.length / this.pageSize) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  resetFilters(): void {
    this.keyword = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleStatus(user: User): void {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    this.userService.updateStatus(user.id, { status: newStatus }).subscribe(() => {
      user.status = newStatus;
      this.loadStats();
      this.applyFilters();
    });
  }

  changeRole(id: number, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as any;
    this.userService.updateRole(id, { role }).subscribe();
  }

  softDelete(id: number): void {
    if (confirm('Confirm deactivation?')) {
      this.userService.deleteUser(id).subscribe(() => {
        this.loadUsers();
        this.loadStats();
      });
    }
  }

  hardDelete(id: number): void {
    if (confirm('Delete permanently? This action cannot be undone.')) {
      this.userService.hardDeleteUser(id).subscribe(() => {
        this.loadUsers();
        this.loadStats();
      });
    }
  }

  restoreUser(user: User): void {
    if (confirm('Restore this user?')) {
      this.userService.updateStatus(user.id, { status: 'ACTIVE' }).subscribe(() => {
        user.status = 'ACTIVE';
        this.loadStats();
        this.applyFilters();
      });
    }
  }

  getRoleBadgeClass(role: string): string {
    return role === 'ADMIN'
      ? 'admin'
      : role === 'HOST'
      ? 'host'
      : 'tourist';
  }

  getStatusBadgeClass(status: string): string {
    return status.toLowerCase();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  getAvatarColor(role: string): string {
    const colors: { [key: string]: string } = {
      ADMIN: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
      HOST: 'linear-gradient(135deg, #11998e, #38ef7d)',
      TOURIST: 'linear-gradient(135deg, #4a90e2, #e67e50)'
    };

    return colors[role] || colors['TOURIST'];
  }
}