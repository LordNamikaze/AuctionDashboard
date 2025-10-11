import { Component, inject } from '@angular/core';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { PlayerList } from './components/player-list/player-list';
import { LoginComponent } from './components/login/login.component';
import { Router, RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AdminDashboard, PlayerList, LoginComponent, RouterModule, NgIf],
  template: `
    <nav *ngIf="authService.isLoggedIn()" class="nav-bar">
      <div class="nav-links">
        <a *ngIf="isAdmin" routerLink="/admin" routerLinkActive="active">Admin Dashboard</a>
        <a routerLink="/players" routerLinkActive="active">Player List</a>
      </div>
      <button class="logout-btn" (click)="logout()">Logout</button>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .nav-bar {
      background: #f8f9fa;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #dee2e6;
    }
    .nav-links {
      display: flex;
      gap: 1rem;
    }
    .nav-bar a {
      text-decoration: none;
      color: #333;
      padding: 0.5rem 1rem;
      border-radius: 4px;
    }
    .nav-bar a:hover {
      background: #e9ecef;
    }
    .nav-bar a.active {
      background: #007bff;
      color: white;
    }
    .logout-btn {
      padding: 0.5rem 1rem;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .logout-btn:hover {
      background: #c82333;
    }
  `]
})
export class App {
  authService = inject(AuthService);
  private router = inject(Router);

  get isAdmin() {
    return this.authService.getRole() === 'admin';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
