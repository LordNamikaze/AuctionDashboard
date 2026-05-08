import { Injectable } from '@angular/core';
import { ConfigService } from './config-service';
import { firstValueFrom } from 'rxjs';

export type UserRole = 'admin' | 'bidder' | 'readonly' | null;

interface UserRecord {
  Email: string;
  Name: string;
  Role: string;
}

interface UsersResponse {
  users: UserRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentRole: UserRole = null;
  private isAuthenticated = false;

  constructor(private configService: ConfigService) {}

  async login(email: string): Promise<UserRole> {
    try {
      const result = await firstValueFrom(this.configService.getUsers()) as UsersResponse;
      const normalizedEmail = String(email).trim().toLowerCase();
      const user = result.users?.find(u => String(u.Email || '').trim().toLowerCase() === normalizedEmail);

      if (!user) {
        this.currentRole = null;
        this.isAuthenticated = false;
        throw new Error('Invalid email');
      }

      const role = String(user.Role || '').trim().toLowerCase();
      if (role === 'admin' || role === 'bidder' || role === 'readonly') {
        this.currentRole = role as UserRole;
        this.isAuthenticated = true;
        return this.currentRole;
      }

      this.currentRole = null;
      this.isAuthenticated = false;
      throw new Error('Invalid role');

    } catch (error) {
      this.currentRole = null;
      this.isAuthenticated = false;
      throw error;
    }
  }

  logout() {
    this.currentRole = null;
    this.isAuthenticated = false;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getRole(): UserRole {
    return this.currentRole;
  }
}