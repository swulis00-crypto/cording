/**
 * 화면 컴포넌트: 게임 선택 화면
 *  - 이번 시간에 모은 별(세션 전용) 표시
 *  - 쉬움 / 도전 난이도 선택
 */

import { store, GAME_METADATA } from '../state/store.js';
import { soundFx } from '../audio/soundFx.js';

function starRow(n) {
  return [1, 2, 3].map(i => `<span class="star ${i <= n ? 'on' : ''}">★</span>`).join('');
}

export function renderGameSelectScreen(container) {
  const diff = store.difficulty;
  const games = Object.values(GAME_METADATA);
  const s = store.session;

  container.innerHTML = `
    <div class="game-select-section">
      <div class="section-header">
        <div class="section-header-title">
          <h2>🎯 어떤 게임으로 놀까요?</h2>
          <p>게임마다 책 찾기 비밀이 하나씩 숨어 있어요. 별 3개를 모두 모아 보세요!</p>
        </div>

        <div class="difficulty-toggle-box" role="group" aria-label="난이도">
          <button class="diff-btn ${diff === 'basic' ? 'active' : ''}" data-diff="basic">🌱 쉬움</button>
          <button class="diff-btn ${diff === 'challenge' ? 'active challenge' : ''}" data-diff="challenge">🔥 도전</button>
        </div>
      </div>

      <div class="session-bar glass-panel">
        <div class="session-avatar">${s.avatar}</div>
        <div class="session-stat"><span class="lbl">오늘 모은 별</span><span class="val">⭐ ${s.totalStars} / ${games.length * 3}</span></div>
        <div class="session-stat"><span class="lbl">플레이</span><span class="val">${s.plays}번</span></div>
        <div class="session-stat"><span class="lbl">최고 콤보</span><span class="val">🔥 x${s.bestCombo}</span></div>
        <div class="session-note">새로고침하면 별은 사라져요. 기록은 남기지 않아요!</div>
      </div>

      <div class="games-grid">
        ${games.map(g => {
          const stars = s.stars[g.id] || 0;
          return `
            <div class="glass-panel game-card" data-game-id="${g.id}" style="--card-color: ${g.themeColor};">
              <div class="game-card-stars" title="이번 시간 최고 별">${starRow(stars)}</div>
              <div class="game-card-icon">${g.icon}</div>
              <h3 class="game-card-title">${g.title}</h3>
              <p class="game-card-sub">${g.subtitle}</p>
              <div class="game-card-skills"><span>💡</span> ${g.skills}</div>
              <div class="game-card-footer">
                <span class="game-card-howto">${g.howTo.split('.')[0]}.</span>
                <button class="game-play-btn" data-game-id="${g.id}"><span>시작</span> ▶</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      soundFx.play('click');
      store.setDifficulty(e.currentTarget.getAttribute('data-diff'));
    });
  });

  container.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      soundFx.play('go');
      store.setScreen('game', card.getAttribute('data-game-id'));
    });
  });
}
