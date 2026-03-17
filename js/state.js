// central data store and logic
const STORE_KEY = 'phase10_pwa_state';

class AppState {
  constructor() {
    this.allPlayers = [];
    this.game = null;
    this.loadState();
  }

  loadState() {
    const data = localStorage.getItem(STORE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.allPlayers = parsed.allPlayers || [];
        this.game = parsed.game || null;
      } catch (e) {
        console.error("Local storage Parse error", e);
      }
    }
  }

  saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      allPlayers: this.allPlayers,
      game: this.game
    }));
  }

  // --- Players logic ---
  addPlayer(name) {
    name = name.trim();
    if (!name) return false;
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const avatar = name.charAt(0).toUpperCase();
    this.allPlayers.push({ id, name, avatar });
    this.saveState();
    return true;
  }

  removePlayer(id) {
    this.allPlayers = this.allPlayers.filter(p => p.id !== id);
    this.saveState();
  }

  // --- Game setup ---
  startGame(selectedPlayerIds) {
    if (selectedPlayerIds.length < 2) return false;
    
    // Players are ordered exactly as selected
    const playersInGame = selectedPlayerIds.map(id => {
      const p = this.allPlayers.find(ap => ap.id === id);
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        phase: 1,
        score: 0
      };
    });

    this.game = {
      round: 1,
      dealerIndex: 0,
      players: playersInGame,
      isTie: false,
      tiedPlayers: []
    };
    this.saveState();
    return true;
  }

  quitGame() {
    this.game = null;
    this.saveState();
  }

  // --- Game play ---
  endHand(scoresAndPhases) {
    if (!this.game) return null;

    let anyoneFinished = false;

    // Apply scores and phases
    this.game.players.forEach(p => {
      const data = scoresAndPhases.find(d => d.id === p.id);
      if (data) {
        p.score += data.score;
        if (data.phaseCompleted) {
          p.phase += 1;
          if (p.phase > 10) {
            anyoneFinished = true;
          }
        }
      }
    });

    this.game.round++;
    
    // Rotate dealer
    this.game.dealerIndex = (this.game.dealerIndex + 1) % this.game.players.length;

    this.saveState();

    if (anyoneFinished) {
      return this.checkWinners();
    }
    
    return { type: 'continue' };
  }

  checkWinners() {
    const finishedPlayers = this.game.players.filter(p => p.phase > 10);
    if (finishedPlayers.length === 0) return { type: 'continue' };

    if (finishedPlayers.length === 1) {
      return { type: 'win', winners: finishedPlayers };
    }

    // Multiple players finished phase 10, find lowest score
    finishedPlayers.sort((a, b) => a.score - b.score);
    const lowestScore = finishedPlayers[0].score;
    const tieWinners = finishedPlayers.filter(p => p.score === lowestScore);

    if (tieWinners.length === 1) {
      return { type: 'win', winners: [tieWinners[0]] };
    }

    this.game.isTie = true;
    this.game.tiedPlayers = tieWinners.map(p => p.id);
    this.saveState();
    
    return { type: 'tie', winners: tieWinners };
  }

  tieBreak() {
    // Only tied players repeat Phase 10
    this.game.players.forEach(p => {
      if (this.game.tiedPlayers.includes(p.id)) {
        p.phase = 10; // set back to 10 so they have to complete it again
      }
    });
    this.game.isTie = false;
    this.game.tiedPlayers = [];
    this.saveState();
  }

  forceTieEnd() {
    const winners = this.game.players.filter(p => this.game.tiedPlayers.includes(p.id));
    this.quitGame();
    return winners;
  }
}

const state = new AppState();
