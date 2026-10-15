/**
 * 메인 엔트리포인트 & 화면 라우팅
 *  - 게임 아레나(HUD, 카운트다운, 스테이지 오버레이, 힌트 토스트, 터치 컨트롤)
 *  - 이용자 정보/순위는 저장하지 않습니다.
 */

import { store, GAME_METADATA } from './state/store.js';
import { soundFx } from './audio/soundFx.js';

import { renderStartScreen } from './components/startScreen.js';
import { renderGameSelectScreen } from './components/gameSelectScreen.js';
import { renderTutorialScreen } from './components/tutorialModal.js';
import { renderAdminPanelScreen } from './components/adminPanelScreen.js';
import { showResultModal, computeStars } from './components/resultModal.js';

import { MazeGame } from './games/mazeGame.js';
import { ShelfSortGame } from './games/shelfSortGame.js';
import { SpaceDefenseGame } from './games/spaceDefenseGame.js';
import { BrickBreakerGame } from './games/brickBreakerGame.js';
import { SnakeGame } from './games/snakeGame.js';
import { WhackMoleGame } from './games/whackMoleGame.js';

const GAME_CLASSES = {
  maze: MazeGame,
  shelfSort: ShelfSortGame,
  spaceDefense: SpaceDefenseGame,
  brickBreaker: BrickBreakerGame,
  snake: SnakeGame,
  whackMole: WhackMoleGame
};

let activeGame = null;
let arenaTimers = [];
let arenaCleanups = [];
let rotateHintDismissed = false;

// 디버그/자동 테스트용 훅 (이용자 정보 없음)
window.__bookTrail = {
  get game() { return activeGame; },
  get store() { return store; }
};

/* ------------------------------------------------------------------ */
/* 초기화                                                               */
/* ------------------------------------------------------------------ */

function initApp() {
  const mainContent = document.getElementById('mainContent');
  const soundBtn = document.getElementById('btnToggleSound');
  const bgmBtn = document.getElementById('btnToggleBgm');
  const avatarBadge = document.getElementById('avatarBadge');
  const brandLogo = document.getElementById('brandLogo');

  // 저장된 소리 설정 적용
  soundFx.setMuted(!store.settings.sound);
  const paintSound = () => {
    const muted = soundFx.isMuted();
    soundBtn.classList.toggle('muted', muted);
    soundBtn.textContent = muted ? '🔇' : '🔊';
    soundBtn.title = muted ? '효과음 켜기' : '효과음 끄기';
  };
  const paintBgm = () => {
    bgmBtn.classList.toggle('off', !soundFx.bgmPlaying);
    bgmBtn.textContent = soundFx.bgmPlaying ? '🎵' : '🎶';
    bgmBtn.title = soundFx.bgmPlaying ? '배경음악 끄기' : '배경음악 켜기';
  };
  paintSound();
  paintBgm();

  soundBtn.addEventListener('click', () => {
    const muted = soundFx.toggleMute();
    store.setSetting('sound', !muted);
    paintSound();
    paintBgm();
  });

  bgmBtn.addEventListener('click', () => {
    soundFx.toggleBgm();
    store.setSetting('bgm', soundFx.bgmPlaying);
    paintBgm();
  });

  brandLogo.addEventListener('click', () => {
    soundFx.play('click');
    destroyCurrentGame();
    store.setScreen('start');
  });

  if (avatarBadge) {
    avatarBadge.addEventListener('click', () => {
      soundFx.play('click');
      destroyCurrentGame();
      store.setScreen('start');
    });
  }

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      soundFx.play('click');
      destroyCurrentGame();
      store.setScreen(e.currentTarget.getAttribute('data-screen'));
    });
  });

  store.subscribe((state) => {
    updateHeader(state);
    renderCurrentScreen(state, mainContent);
  });

  updateHeader(store);
  renderCurrentScreen(store, mainContent);
}

function destroyCurrentGame() {
  arenaTimers.forEach(t => clearTimeout(t));
  arenaTimers = [];
  arenaCleanups.forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
  arenaCleanups = [];
  if (activeGame) {
    try { activeGame.destroy(); } catch (e) { /* ignore */ }
    activeGame = null;
  }
}

function updateHeader(state) {
  const av = document.getElementById('headerAvatar');
  if (av) av.textContent = state.session.avatar;
  const starEl = document.getElementById('headerStars');
  if (starEl) starEl.textContent = `⭐ ${state.session.totalStars}`;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const screen = btn.getAttribute('data-screen');
    const active = state.currentScreen === screen || (screen === 'game-select' && state.currentScreen === 'game');
    btn.classList.toggle('active', active);
  });
  document.body.classList.toggle('in-game', state.currentScreen === 'game');
}

function renderCurrentScreen(state, container) {
  if (state.currentScreen !== 'game') destroyCurrentGame();

  switch (state.currentScreen) {
    case 'start': renderStartScreen(container); break;
    case 'game-select': renderGameSelectScreen(container); break;
    case 'tutorial': renderTutorialScreen(container); break;
    case 'admin': renderAdminPanelScreen(container); break;
    case 'game': renderGameArena(container, state); break;
    default: renderStartScreen(container);
  }
}

/* ------------------------------------------------------------------ */
/* 게임 아레나                                                           */
/* ------------------------------------------------------------------ */

function renderGameArena(container, state) {
  destroyCurrentGame();

  const gameId = state.selectedGame || 'maze';
  const meta = GAME_METADATA[gameId] || GAME_METADATA.maze;
  const diff = state.difficulty;
  const questions = store.getRound(gameId, diff);
  const GameClass = GAME_CLASSES[gameId] || MazeGame;

  const controls = meta.controls || 'dpad';
  const showDpad = controls === 'dpad';
  const showLR = controls === 'horizontal' || controls === 'horizontal-action';
  const showAction = controls === 'action' || controls === 'horizontal-action';
  const actionLabel = controls === 'action' ? '확인!' : (gameId === 'brickBreaker' ? '발사!' : '발사!');
  const showTouchBar = controls !== 'pointer';

  container.innerHTML = `
    <div class="game-screen">
      <div class="game-hud">
        <div class="hud-game-info">
          <div class="hud-game-icon">${meta.icon}</div>
          <div class="hud-game-title">
            <h2>${meta.title}</h2>
            <span class="diff-chip ${diff}">${diff === 'challenge' ? '🔥 도전' : '🌱 쉬움'}</span>
          </div>
        </div>

        <div class="hud-stats-group">
          <div class="hud-stat-pill">
            <span class="hud-stat-label">점수</span>
            <span class="hud-stat-value score" id="hudScore">0</span>
          </div>
          <div class="hud-stat-pill">
            <span class="hud-stat-label">시간</span>
            <span class="hud-stat-value timer" id="hudTimer">--</span>
          </div>
          <div class="hud-stat-pill" id="hudLivesPill">
            <span class="hud-stat-label">하트</span>
            <span class="hud-stat-value lives" id="hudLives">❤️❤️❤️</span>
          </div>
          <div class="hud-stat-pill combo hidden" id="hudComboPill">
            <span class="hud-stat-label">콤보</span>
            <span class="hud-stat-value combo" id="hudCombo">x2</span>
          </div>
        </div>

        <div class="hud-actions">
          <button id="btnExitGame" class="hud-btn exit">나가기 ✕</button>
        </div>
      </div>

      <div class="game-clue-banner">
        <div class="clue-icon-box">🔍</div>
        <div class="clue-text-body">
          <div class="clue-tag" id="clueTag">준비 중...</div>
          <div class="clue-title" id="clueTitle"></div>
          <div class="clue-instruction" id="clueInstruction">잠시만요, 곧 시작해요!</div>
        </div>
      </div>

      <div class="rotate-hint ${rotateHintDismissed ? 'hidden' : ''}" id="rotateHint">
        <span>📱 휴대폰을 <strong>가로로</strong> 돌리면 글씨가 커져요!</span>
        <button id="btnRotateHintClose" aria-label="닫기">알겠어요</button>
      </div>

      <div class="game-viewport-card">
        <canvas id="gameCanvas" width="800" height="520"></canvas>
        <div class="arena-overlay" id="arenaOverlay"></div>
        <div class="game-toast" id="gameToast"></div>
      </div>

      <div class="touch-controls-bar ${showTouchBar ? '' : 'hidden'}">
        <div class="touch-dpad ${showDpad || showLR ? '' : 'hidden'} ${showLR ? 'lr-only' : ''}">
          <button class="touch-dbtn up ${showDpad ? '' : 'hidden'}" data-dir="0,-1" aria-label="위">▲</button>
          <button class="touch-dbtn left" data-dir="-1,0" aria-label="왼쪽">◀</button>
          <button class="touch-dbtn down ${showDpad ? '' : 'hidden'}" data-dir="0,1" aria-label="아래">▼</button>
          <button class="touch-dbtn right" data-dir="1,0" aria-label="오른쪽">▶</button>
        </div>
        <div class="touch-action-group ${showAction ? '' : 'hidden'}">
          <button class="touch-action-btn" id="touchActionBtn"><span>${actionLabel}</span></button>
        </div>
      </div>

      <p class="game-howto">💡 ${meta.howTo}</p>
    </div>
  `;

  const canvas = container.querySelector('#gameCanvas');
  const hudScore = container.querySelector('#hudScore');
  const hudTimer = container.querySelector('#hudTimer');
  const hudLives = container.querySelector('#hudLives');
  const hudLivesPill = container.querySelector('#hudLivesPill');
  const hudComboPill = container.querySelector('#hudComboPill');
  const hudCombo = container.querySelector('#hudCombo');
  const clueTag = container.querySelector('#clueTag');
  const clueTitle = container.querySelector('#clueTitle');
  const clueInstruction = container.querySelector('#clueInstruction');
  const overlay = container.querySelector('#arenaOverlay');
  const toast = container.querySelector('#gameToast');
  const btnExit = container.querySelector('#btnExitGame');

  const rotateClose = container.querySelector('#btnRotateHintClose');
  if (rotateClose) {
    rotateClose.addEventListener('click', () => {
      rotateHintDismissed = true;
      container.querySelector('#rotateHint').classList.add('hidden');
    });
  }

  let toastTimer = null;
  const showToast = (html, kind = 'info', ms = 2600) => {
    toast.innerHTML = html;
    toast.className = `game-toast show ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = 'game-toast'; }, ms);
  };

  const hideOverlay = () => {
    overlay.classList.remove('active');
    overlay.innerHTML = '';
  };

  const config = {
    questions,
    difficulty: diff,
    avatar: store.session.avatar,

    onStatsUpdate: (s) => {
      hudScore.textContent = s.score.toLocaleString();
      hudTimer.textContent = `${s.time}s`;
      hudTimer.classList.toggle('urgent', s.time <= 10);
      if (s.lives === null || s.lives === undefined) {
        hudLivesPill.classList.add('hidden');
      } else {
        hudLivesPill.classList.remove('hidden');
        hudLives.textContent = s.lives > 0 ? '❤️'.repeat(s.lives) : '💔';
      }
      if (s.combo >= 2) {
        hudComboPill.classList.remove('hidden');
        hudCombo.textContent = `x${s.combo}`;
      } else {
        hudComboPill.classList.add('hidden');
      }
    },

    onClueUpdate: (info) => {
      clueTag.textContent = info.tag || '';
      clueTitle.textContent = info.title || '';
      clueInstruction.textContent = info.clue || '';
      clueInstruction.classList.remove('pop');
      void clueInstruction.offsetWidth;
      clueInstruction.classList.add('pop');
    },

    onWrong: (info) => {
      if (!info || !info.hint) return;
      showToast(`<span class="toast-emoji">🤔</span><span>${escapeHtml(info.hint)}</span>`, 'wrong', 3000);
    },

    onStageClear: (info, next) => {
      if (info.quick) {
        showToast(
          `<span class="toast-emoji">✅</span><span><strong>${escapeHtml(info.title || '정답!')}</strong> ${escapeHtml(info.explanation || '')}</span>`,
          'correct',
          2200
        );
        return;
      }

      const isFail = !!info.fail;
      const nextLabel = info.isLast ? '결과 보기 ▶' : '다음 문제 ▶';
      overlay.innerHTML = `
        <div class="overlay-card ${isFail ? 'fail' : 'success'}">
          <div class="overlay-icon-large">${isFail ? '🤔' : ['🎉', '🌟', '🏅', '🚀'][info.index % 4]}</div>
          <h3 class="overlay-title">${escapeHtml(info.title || (isFail ? '정답을 확인해요' : '정답!'))}</h3>
          ${info.answer ? `<div class="overlay-answer">${escapeHtml(info.answer)}</div>` : ''}
          <p class="overlay-desc">${escapeHtml(info.explanation || '')}</p>
          <div class="overlay-progress"><span class="overlay-progress-dots">${Array.from({ length: info.total }, (_, i) => `<i class="${i < info.index + 1 ? 'done' : ''}"></i>`).join('')}</span></div>
          <button class="btn-primary-large overlay-next-btn" id="overlayNextBtn"><span>${nextLabel}</span></button>
          <div class="overlay-autobar"><div class="overlay-autobar-fill"></div></div>
        </div>
      `;
      overlay.classList.add('active');

      let advanced = false;
      const go = () => {
        if (advanced) return;
        advanced = true;
        soundFx.play('click');
        hideOverlay();
        next();
      };
      overlay.querySelector('#overlayNextBtn').addEventListener('click', go);
      const auto = setTimeout(go, 7000);
      arenaTimers.push(auto);
    },

    onComplete: (result) => {
      result.gameId = gameId;
      result.stars = computeStars(result);
      store.recordResult(gameId, result.stars, result.score, result.maxCombo);
      updateHeader(store);
      hideOverlay();
      showResultModal(
        result,
        () => { destroyCurrentGame(); renderGameArena(container, state); },
        () => { destroyCurrentGame(); store.setScreen('game-select'); }
      );
    }
  };

  activeGame = new GameClass(canvas, config);
  activeGame.preview();

  // 탭/앱을 벗어나면 자동 일시정지 → 돌아오면 "계속하기"
  const showPauseOverlay = (title, desc) => {
    overlay.innerHTML = `
      <div class="overlay-card">
        <div class="overlay-icon-large">⏸️</div>
        <h3 class="overlay-title">${title}</h3>
        <p class="overlay-desc">${desc}</p>
        <button class="btn-primary-large overlay-next-btn" id="btnResumeGame"><span>▶ 계속하기</span></button>
      </div>
    `;
    overlay.classList.add('active');
    overlay.querySelector('#btnResumeGame').addEventListener('click', () => {
      soundFx.play('click');
      hideOverlay();
      if (activeGame) activeGame.resume();
    });
  };
  const onVisibility = () => {
    if (document.hidden && activeGame && activeGame.isRunning && !activeGame.isPaused && !overlay.classList.contains('active')) {
      activeGame.pause();
      showPauseOverlay('잠깐 멈췄어요', '다른 화면에 다녀오셨네요. 준비되면 계속하기를 눌러요!');
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  arenaCleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

  // 멈춤 상태 자동 복구: 일시정지인데 오버레이도 결과창도 없으면 다시 진행
  const watchdog = setInterval(() => {
    if (!activeGame || !activeGame.isRunning) return;
    const modalOpen = !!document.querySelector('#modalContainer .modal-backdrop');
    if (activeGame.isPaused && !overlay.classList.contains('active') && !modalOpen) {
      activeGame.resume();
    }
  }, 1000);
  arenaCleanups.push(() => clearInterval(watchdog));

  // 나가기: 게임을 멈추고 확인
  btnExit.addEventListener('click', () => {
    soundFx.play('click');
    if (!activeGame) { store.setScreen('game-select'); return; }
    const wasPaused = activeGame.isPaused;
    activeGame.pause();
    overlay.innerHTML = `
      <div class="overlay-card">
        <div class="overlay-icon-large">🙋</div>
        <h3 class="overlay-title">여기서 그만할까요?</h3>
        <p class="overlay-desc">지금까지의 점수는 저장되지 않아요. 계속하면 바로 이어서 놀 수 있어요!</p>
        <div class="overlay-btn-row">
          <button class="btn-primary-large" id="btnResumeGame"><span>▶ 계속하기</span></button>
          <button class="btn-secondary-large" id="btnConfirmExit"><span>나가기</span></button>
        </div>
      </div>
    `;
    overlay.classList.add('active');
    overlay.querySelector('#btnResumeGame').addEventListener('click', () => {
      soundFx.play('click');
      hideOverlay();
      if (activeGame && !wasPaused) activeGame.resume();
    });
    overlay.querySelector('#btnConfirmExit').addEventListener('click', () => {
      soundFx.play('click');
      destroyCurrentGame();
      store.setScreen('game-select');
    });
  });

  // 터치 컨트롤
  const bindHold = (elem, onPress, onRelease) => {
    if (!elem) return;
    const press = (e) => { e.preventDefault(); onPress(); };
    const release = (e) => { e.preventDefault(); if (onRelease) onRelease(); };
    elem.addEventListener('pointerdown', press);
    elem.addEventListener('pointerup', release);
    elem.addEventListener('pointercancel', release);
    elem.addEventListener('pointerleave', release);
  };

  container.querySelectorAll('.touch-dbtn').forEach(btn => {
    const [dx, dy] = btn.getAttribute('data-dir').split(',').map(Number);
    bindHold(btn,
      () => { if (activeGame && activeGame.setDirection) activeGame.setDirection(dx, dy); },
      () => { if (activeGame && activeGame.setDirection && showLR) activeGame.setDirection(0, 0); }
    );
  });

  bindHold(container.querySelector('#touchActionBtn'), () => {
    if (!activeGame) return;
    if (activeGame.shoot) activeGame.shoot();
    else if (activeGame.checkSolution) activeGame.checkSolution();
  });

  // 카운트다운 → 시작
  runCountdown(overlay, meta, () => {
    hideOverlay();
    if (activeGame && !activeGame.finished) {
      soundFx.play('go');
      activeGame.start();
    }
  });
}

function runCountdown(overlay, meta, onDone) {
  const steps = ['3', '2', '1', '출발!'];
  let i = 0;
  overlay.innerHTML = `
    <div class="overlay-card countdown">
      <div class="overlay-icon-large">${meta.icon}</div>
      <h3 class="overlay-title">${meta.title}</h3>
      <p class="overlay-desc">${meta.howTo}</p>
      <div class="countdown-number" id="countdownNumber">3</div>
    </div>
  `;
  overlay.classList.add('active');
  const numEl = overlay.querySelector('#countdownNumber');

  const tick = () => {
    if (!numEl.isConnected) return; // 화면이 바뀌었으면 중단
    numEl.textContent = steps[i];
    numEl.classList.remove('pop');
    void numEl.offsetWidth;
    numEl.classList.add('pop');
    soundFx.play(i === steps.length - 1 ? 'go' : 'countdown');
    i++;
    if (i < steps.length) {
      arenaTimers.push(setTimeout(tick, 800));
    } else {
      arenaTimers.push(setTimeout(onDone, 600));
    }
  };
  arenaTimers.push(setTimeout(tick, 350));
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', initApp);
