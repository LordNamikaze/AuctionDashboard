import { Component, computed, OnInit, signal } from '@angular/core';
import { Player } from '../../models/Player';
import { AuctionService } from '../../services/auction-service';
import { ConfigService } from '../../services/config-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  players = signal<Player[]>([]);
  teams = signal<any[]>([]);
  currentIndex = signal(0);
  sellingPrice = signal<number | null>(null);
  selectedTeam = signal<string>('');
  primarySelection = signal<string>('All');
  secondarySelection = signal<string>('All');
  positions = signal<string[]>(['All']); // initialize with 'All'
  loading = signal(true);
  errorMessage = signal('');
  initialBudget = signal<number>(0);
  imageSource: string = 'assets/FallBack_KuchNahi.jpg';

  // Computed signal for remaining budgets
  teamPlayerCounts = computed(() => {
    const counts = new Map<string, number>();
    this.teams().forEach(team => {
      counts.set(team.TeamName, this.players().filter(p => p.TeamAssigned === team.TeamName).length);
    });
    return counts;
  });

  remainingBudgets = computed(() => {
    const budgets = new Map<string, number>();
    
    // Initialize budgets for all teams
    this.teams().forEach(team => {
      budgets.set(team.TeamName, this.initialBudget());
    });

    // Subtract spent amounts for sold players
    this.players().forEach(player => {
      if (player.TeamAssigned && player.SoldPrice) {
        const currentBudget = budgets.get(player.TeamAssigned) || 0;
        budgets.set(player.TeamAssigned, currentBudget - player.SoldPrice);
      }
    });

    return budgets;
  });

  constructor(
    public auctionService: AuctionService,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadPositions();
  }

  loadData() {
    this.loading.set(true);
    this.auctionService.loadInitialData().subscribe({
      next: ({ players, teams, budget }) => {
        this.players.set(players);
        this.teams.set(teams);
        this.initialBudget.set(Number(budget.VirtualBudget));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set('Failed to load data');
        console.error(err);
      }
    });
  }

  loadPositions() {
    this.configService.getPositions().subscribe({
      next: (pos) => this.positions.set(['All', ...pos]),
      error: (err) => console.error('Failed to load positions', err)
    });
  }

  // Current player filtered by selected positions
  currentPlayer = computed(() => {
    const filtered = this.getFilteredPlayers();
    const idx = this.currentIndex();
    const current = filtered[idx];
    
    // If current index doesn't have a valid player, reset to first filtered player
    if (!current && filtered.length > 0) {
      this.currentIndex.set(0);
      return filtered[0];
    }
    if(current){
      this.imageSource = 'assets/Images/' + current.PlayerID + '_Image.jpg';
    }
    return current || null;
  });

  // List of upcoming players (after current) filtered
  upcomingPlayers = computed(() => {
    const filtered = this.getFilteredPlayers();
    return filtered.slice(this.currentIndex() + 1);
  });

  // Navigation
  nextPlayer() {
    const filtered = this.getFilteredPlayers();
    const idx = this.currentIndex();
    if (idx < filtered.length - 1) this.currentIndex.set(idx + 1);
  }

  previousPlayer() {
    const idx = this.currentIndex();
    if (idx > 0) this.currentIndex.set(idx - 1);
  }

  // Sell player
  sellPlayer() {
    const player = this.currentPlayer();
    if (!player) return;

    const price = this.sellingPrice();
    const team = this.selectedTeam();
    if (!price || !team) {
      alert('Please enter sold price and select a team.');
      return;
    }

    // Check if team has enough budget
    const teamBudget = this.remainingBudgets().get(team) || 0;
    if (teamBudget < price) {
      alert(`⚠️ ${team} doesn't have enough budget. Remaining: ${teamBudget}`);
      return;
    }

    this.auctionService
      .sellPlayer(player.PlayerID, price, team)
      .subscribe({
        next: (response) => {
          // Update the player in the players list
          this.players.update(players => players.map(p => 
            p.PlayerID === player.PlayerID 
              ? { ...p, SoldPrice: price, TeamAssigned: team }
              : p
          ));
          
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

  // Update filters
  setPrimarySelection(pos: string) {
    this.primarySelection.set(pos);
    // Reset to first matching player
    const filtered = this.getFilteredPlayers();
    if (filtered.length > 0) {
      this.currentIndex.set(0);
    }
  }

  setSecondarySelection(pos: string) {
    this.secondarySelection.set(pos);
    // Reset to first matching player
    const filtered = this.getFilteredPlayers();
    if (filtered.length > 0) {
      this.currentIndex.set(0);
    }
  }

  // Filter logic based on "All" behavior
  private getFilteredPlayers(): Player[] {
    const primary = this.primarySelection();
    const secondary = this.secondarySelection();

    return this.players().filter(p => {
      const primaryMatch = primary === 'All' || p.PrimaryPosition === primary;
      const secondaryMatch = secondary === 'All' || p.SecondaryPosition === secondary;

      if (primary === 'All' && secondary === 'All') return true;
      if (primary === 'All') return secondaryMatch;
      if (secondary === 'All') return primaryMatch;
      return primaryMatch && secondaryMatch;
    });
  }

  // Dynamic image lookup with fallback
  getPlayerImage(player: Player): string {
    const assetsBase = 'assets/';
    // Try to find image with player ID prefix
    return `${assetsBase}${player.PlayerID}_Image.jpg`;
  }
}
