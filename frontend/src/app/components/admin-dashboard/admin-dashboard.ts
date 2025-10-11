import { Component, computed, OnInit, signal } from '@angular/core';
import { Player } from '../../models/Player';
import { AuctionService } from '../../services/auction-service';
import { ConfigService } from '../../services/config-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard {// Signals (Angular 20's reactivity system)
  players = signal<Player[]>([]);
  teams = signal<any[]>([]);
  currentIndex = signal(0);
  sellingPrice = signal<number | null>(null);
  selectedTeam = signal<string>('');
  selectedGroup = signal<string>('');
  loading = signal(true);
  errorMessage = signal('');

  constructor(
    private auctionService: AuctionService,
    private configService: ConfigService
  ) {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.auctionService.loadInitialData().subscribe({
      next: ({ players, teams }) => {
        this.players.set(players);
        this.teams.set(teams);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set('Failed to load data');
        console.error(err);
      }
    });
  }

  // Derived computed signal for current player
  currentPlayer = computed(() => {
    const idx = this.currentIndex();
    const list = this.players();
    return list[idx] || null;
  });

  nextPlayer() {
    const idx = this.currentIndex();
    const list = this.players();
    if (idx < list.length - 1) this.currentIndex.set(idx + 1);
  }

  previousPlayer() {
    const idx = this.currentIndex();
    if (idx > 0) this.currentIndex.set(idx - 1);
  }

  sellPlayer() {
    const player = this.currentPlayer();
    if (!player) return;

    const price = this.sellingPrice();
    const team = this.selectedTeam();
    if (!price || !team) {
      alert('Please enter sold price and select a team.');
      return;
    }

    this.auctionService
      .sellPlayer(player.PlayerID, price, team)
      .subscribe({
        next: () => {
          alert(`✅ Player ${player.Name} sold to ${team}!`);
          this.sellingPrice.set(null);
          this.selectedTeam.set('');
          this.nextPlayer();
        },
        error: (err) => {
          alert('Error selling player');
          console.error(err);
        }
      });
  }

  // Computed list of upcoming players
  upcomingPlayers = computed(() => {
    const group = this.selectedGroup() || this.currentPlayer()?.PrimaryPosition;
    return this.players()
      .filter(
        (p) =>
          p.PrimaryPosition === group || p.SecondaryPosition === group
      )
      .slice(this.currentIndex() + 1, this.currentIndex() + 10);
  });

  changeGroup(group: string) {
    this.selectedGroup.set(group);
  }
}