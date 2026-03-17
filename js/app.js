document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Screens
  const sWelcome = document.getElementById('welcome-screen');
  const sSetup = document.getElementById('setup-screen');
  const sGame = document.getElementById('game-screen');
  const sWinner = document.getElementById('winner-screen');
  const mEndHand = document.getElementById('end-hand-modal');

  // DOM Elements - Welcome UI
  const newPlayerInput = document.getElementById('new-player-input');
  const addPlayerForm = document.getElementById('add-player-form');
  const rosterList = document.getElementById('roster-list');
  const btnToSetup = document.getElementById('btn-to-setup');
  
  // DOM Elements - Setup UI
  const setupPlayerList = document.getElementById('setup-player-list');
  const btnStartGame = document.getElementById('btn-start-game');
  const selectedCountDisplay = document.getElementById('selected-count');
  const btnBackSetup = document.querySelector('.back-btn[data-target="welcome-screen"]');

  // DOM Elements - Game UI
  const gamePlayerList = document.getElementById('game-player-list');
  const currentRoundDisplay = document.getElementById('current-round');
  const btnQuitGame = document.getElementById('btn-quit-game');
  const btnEndHand = document.getElementById('btn-end-hand');

  // DOM Elements - Modal UI
  const endHandPlayerList = document.getElementById('end-hand-player-list');
  const btnCloseModal = document.querySelector('.close-modal-btn');
  const btnSubmitScores = document.getElementById('btn-submit-scores');

  // DOM Elements - Winner UI
  const winnerTitle = document.getElementById('winner-title');
  const winnerSubtitle = document.getElementById('winner-subtitle');
  const winnerList = document.getElementById('winner-list');
  const tieOptions = document.getElementById('tie-options');
  const winnerActions = document.getElementById('winner-actions');
  const btnTieBreak = document.getElementById('btn-tie-break');
  const btnTieEnd = document.getElementById('btn-tie-end');
  const btnNewGameHome = document.getElementById('btn-new-game-home');

  let selectedPlayersForGame = new Set();
  
  // Theme Toggle Logic
  const themeToggle = document.querySelector('.theme-toggle');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('theme-light');
    document.body.classList.toggle('theme-dark');
  });

  // Navigation controller
  function switchScreen(targetScreen) {
    [sWelcome, sSetup, sGame, sWinner].forEach(s => s.classList.remove('active'));
    targetScreen.classList.add('active');
  }

  // Application initialization
  function initApp() {
    if (state.game && state.game.players) {
      if (state.game.isTie) {
        showTieScreen(state.game.players.filter(p => state.game.tiedPlayers.includes(p.id)));
      } else {
        renderGame();
        switchScreen(sGame);
      }
    } else {
      renderWelcome();
      switchScreen(sWelcome);
    }
  }

  // --- WELCOME SCREEN LOGIC ---
  addPlayerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.addPlayer(newPlayerInput.value)) {
      newPlayerInput.value = '';
      renderWelcome();
      rosterList.scrollTo(0, rosterList.scrollHeight);
    }
  });

  function renderWelcome() {
    rosterList.innerHTML = '';
    state.allPlayers.forEach(p => {
      const li = document.createElement('li');
      li.className = 'player-card';
      li.innerHTML = `
        <div class="player-card-left">
          <div class="avatar">${p.avatar}</div>
          <span class="player-name">${p.name}</span>
        </div>
        <button class="delete-btn" data-id="${p.id}" aria-label="Delete player">
          <span class="material-symbols-outlined">close</span>
        </button>
      `;
      li.querySelector('.delete-btn').addEventListener('click', () => {
        state.removePlayer(p.id);
        renderWelcome();
      });
      rosterList.appendChild(li);
    });

    btnToSetup.disabled = state.allPlayers.length < 2;
    btnToSetup.style.opacity = btnToSetup.disabled ? '0.5' : '1';
  }

  btnToSetup.addEventListener('click', () => {
    if (state.allPlayers.length >= 2) {
      selectedPlayersForGame.clear();
      renderSetup();
      switchScreen(sSetup);
    }
  });

  btnBackSetup.addEventListener('click', () => {
    switchScreen(sWelcome);
  });

  // --- SETUP SCREEN LOGIC ---
  function renderSetup() {
    setupPlayerList.innerHTML = '';
    state.allPlayers.forEach(p => {
      const li = document.createElement('li');
      li.className = 'player-card selectable-item';
      if (selectedPlayersForGame.has(p.id)) {
        li.classList.add('selected');
      }
      li.innerHTML = `
        <div class="player-card-left">
          <div class="avatar">${p.avatar}</div>
          <span class="player-name">${p.name}</span>
        </div>
        <div class="checkbox-circle" aria-hidden="true">
          <span class="material-symbols-outlined" style="font-size:16px; font-weight:800">check</span>
        </div>
      `;
      li.addEventListener('click', () => {
        if (selectedPlayersForGame.has(p.id)) {
          selectedPlayersForGame.delete(p.id);
        } else {
          selectedPlayersForGame.add(p.id);
        }
        renderSetup();
      });
      setupPlayerList.appendChild(li);
    });

    selectedCountDisplay.textContent = selectedPlayersForGame.size;
    btnStartGame.disabled = selectedPlayersForGame.size < 2;
    btnStartGame.style.opacity = btnStartGame.disabled ? '0.5' : '1';
  }

  btnStartGame.addEventListener('click', () => {
    if (state.startGame(Array.from(selectedPlayersForGame))) {
      renderGame();
      switchScreen(sGame);
    }
  });

  // --- GAME SCREEN LOGIC ---
  function renderGame() {
    const game = state.game;
    currentRoundDisplay.textContent = game.round;
    gamePlayerList.innerHTML = '';

    // Calculate phase progress (max = 10)
    game.players.forEach((p, index) => {
      const isDealer = index === game.dealerIndex;
      const li = document.createElement('li');
      li.className = 'player-card game-card';
      if (isDealer) li.classList.add('is-dealer');

      const progressWidth = Math.min((p.phase / 10) * 100, 100);

      li.innerHTML = `
        <div class="game-card-top w-full">
          <div class="player-card-left">
            <div class="avatar">${p.avatar}</div>
            <div style="display:flex; flex-direction:column; align-items:flex-start;">
              <span class="player-name">${p.name}</span>
              <span class="phase-text mt-1">Phase ${p.phase <= 10 ? p.phase : 'Done'}</span>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <div class="dealer-badge mb-1">Dealer</div>
            <span class="score-display">${p.score}</span>
          </div>
        </div>
        <div class="progress-bar w-full">
          <div class="progress-fill" style="width: ${progressWidth}%"></div>
        </div>
      `;
      gamePlayerList.appendChild(li);
    });
  }

  btnQuitGame.addEventListener('click', () => {
    if (confirm('Are you sure you want to quit the current game?')) {
      state.quitGame();
      renderWelcome();
      switchScreen(sWelcome);
    }
  });

  btnEndHand.addEventListener('click', () => {
    renderEndHandModal();
    mEndHand.classList.remove('hidden');
    // Slight delay to allow display:block to apply before animating opacity
    setTimeout(() => {
      mEndHand.classList.add('active');
    }, 10);
  });

  // --- END ROUND MODAL LOGIC ---
  btnCloseModal.addEventListener('click', () => {
    closeModal();
  });

  function closeModal() {
    mEndHand.classList.remove('active');
    setTimeout(() => {
      mEndHand.classList.add('hidden');
    }, 300); // Matches CSS transition duration
  }

  function renderEndHandModal() {
    endHandPlayerList.innerHTML = '';
    state.game.players.forEach(p => {
      const li = document.createElement('li');
      li.className = 'end-hand-card';
      li.dataset.id = p.id;
      
      const isPhaseComplete = p.phase > 10;
      
      li.innerHTML = `
        <div class="player-card-left" style="grid-column: 1 / -1; justify-content: space-between;">
           <div style="display:flex; align-items:center; gap: 1rem;">
              <div class="avatar" style="width: 32px; height: 32px; font-size:1rem;">${p.avatar}</div>
              <span class="player-name" style="font-size:0.95rem;">${p.name}</span>
           </div>
           <span class="phase-text" style="color:var(--primary);">Phase ${p.phase <= 10 ? p.phase : 'Done'}</span>
        </div>
        
        <div class="score-input">
           <span class="material-symbols-outlined text-muted" style="font-size:20px;">add_circle</span>
           <input type="number" class="end-score-input" value="0" min="0" step="5" data-id="${p.id}" aria-label="Score added for ${p.name}"/>
        </div>

        <div class="switch-wrapper">
          <span class="switch-label">Completed Phase?</span>
          <label class="switch">
            <input type="checkbox" class="end-phase-input" data-id="${p.id}" ${isPhaseComplete ? 'checked disabled' : ''} aria-label="Phase completed for ${p.name}">
            <span class="slider"></span>
          </label>
        </div>
        <div class="divider"></div>
      `;

      endHandPlayerList.appendChild(li);
    });
    
    // Auto-select input text when focused for quick data entry
    const inputs = endHandPlayerList.querySelectorAll('.end-score-input');
    inputs.forEach(inp => {
       inp.addEventListener('focus', function() {
          this.select();
       });
    });
  }

  btnSubmitScores.addEventListener('click', () => {
    const scoresAndPhases = [];
    const inputs = document.querySelectorAll('.end-score-input');
    const phaseCheckboxes = document.querySelectorAll('.end-phase-input');

    state.game.players.forEach(p => {
      const scoreInp = Array.from(inputs).find(i => i.dataset.id === p.id);
      const phaseChk = Array.from(phaseCheckboxes).find(i => i.dataset.id === p.id);
      
      scoresAndPhases.push({
        id: p.id,
        score: parseInt(scoreInp.value) || 0,
        phaseCompleted: phaseChk ? phaseChk.checked : false
      });
    });

    const result = state.endHand(scoresAndPhases);
    closeModal();

    if (result.type === 'continue') {
      renderGame();
    } else if (result.type === 'win') {
      showWinnerScreen(result.winners);
    } else if (result.type === 'tie') {
      showTieScreen(result.winners);
    }
  });

  // --- WINNER / TIE LOGIC ---
  function showWinnerScreen(winners) {
    if (winners.length > 1) {
       winnerTitle.textContent = "It's a Tie!";
       winnerSubtitle.textContent = "Congratulations to the winners for a tied game.";
    } else {
       winnerTitle.textContent = "We have a Winner!";
       winnerSubtitle.textContent = "Congratulations on completing all 10 phases!";
    }
      
    tieOptions.classList.add('hidden');
    winnerActions.classList.remove('hidden');

    renderWinnersAvatars(winners);
    state.quitGame();
    switchScreen(sWinner);
  }

  function showTieScreen(tiedPlayers) {
    winnerTitle.textContent = "It's a Tie!";
    winnerSubtitle.textContent = "You completed Phase 10 tied in score.";
    tieOptions.classList.remove('hidden');
    winnerActions.classList.add('hidden');

    renderWinnersAvatars(tiedPlayers);
    switchScreen(sWinner);
  }

  function renderWinnersAvatars(players) {
    winnerList.innerHTML = '';
    players.forEach(p => {
      const div = document.createElement('div');
      div.className = 'winner-avatar-col';
      div.innerHTML = `
        <div class="avatar shadow-glow" style="border:2px solid var(--primary);">${p.avatar}</div>
        <span class="player-name mt-2" style="font-size:1.2rem;">${p.name}</span>
        <span class="score-display" style="font-size:1rem;">${p.score} pts</span>
      `;
      winnerList.appendChild(div);
    });
  }

  btnTieBreak.addEventListener('click', () => {
    state.tieBreak();
    renderGame();
    switchScreen(sGame);
  });

  btnTieEnd.addEventListener('click', () => {
    const winners = state.forceTieEnd();
    showWinnerScreen(winners);
  });

  btnNewGameHome.addEventListener('click', () => {
    renderWelcome();
    switchScreen(sWelcome);
  });

  // --- PWA INSTALLATION LOGIC ---
  const btnInstall = document.getElementById('btn-install');
  const iosInstallPrompt = document.getElementById('ios-install-prompt');
  const btnCloseIosPrompt = document.getElementById('btn-close-ios-prompt');
  let deferredPrompt;

  // Wait for the browser to fire the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Notify user by showing our custom install button
    if (btnInstall) {
      btnInstall.classList.remove('hidden');
    }
  });

  // Handle the click on our custom install button
  if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
      // Hide the button
      btnInstall.classList.add('hidden');
      if (deferredPrompt) {
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // Nullify the prompt since it can only be used once
        deferredPrompt = null;
      }
    });
  }

  // Hide button if the app is successfully installed
  window.addEventListener('appinstalled', () => {
    if (btnInstall) btnInstall.classList.add('hidden');
    deferredPrompt = null;
    console.log('PWA was successfully installed');
  });

  // --- iOS INSTALLATION PROMPT ---
  const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };
  
  // Detects if device is in standalone mode
  const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

  if (isIos() && !isInStandaloneMode() && iosInstallPrompt) {
    // Show iOS prompt, but avoid spamming the user on every visit
    const hasShownIosPrompt = localStorage.getItem('pwa_ios_prompt_shown');
    if (!hasShownIosPrompt) {
      setTimeout(() => {
        iosInstallPrompt.classList.remove('hidden');
        iosInstallPrompt.classList.add('active'); // active triggers opacity / transform animation
        localStorage.setItem('pwa_ios_prompt_shown', 'true');
      }, 2500); // Wait couple of seconds before showing
    }
  }

  if (btnCloseIosPrompt) {
    btnCloseIosPrompt.addEventListener('click', () => {
      iosInstallPrompt.classList.remove('active');
      setTimeout(() => iosInstallPrompt.classList.add('hidden'), 300);
    });
  }

  // Initialize Application
  initApp();
});
