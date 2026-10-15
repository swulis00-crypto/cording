/**
 * 화면 컴포넌트: 시작 화면
 *  - 마스코트 '책벌레 북이'의 인사
 *  - 내 캐릭터(아바타) 고르기 (저장하지 않음)
 *  - 이름이나 개인정보를 입력받지 않습니다.
 */

import { store, AVATARS } from '../state/store.js';
import { soundFx } from '../audio/soundFx.js';

const GREETINGS = [
  '안녕! 나는 책벌레 <strong>북이</strong>야. 도서관에서 책을 빨리 찾는 비밀, 숫자 암호를 같이 풀어볼까?',
  '도서관 책에는 모두 <strong>주소</strong>가 붙어 있어! 그 주소를 읽을 수 있으면 어떤 책도 금방 찾아.',
  '게임을 하면서 책 주소 읽는 법을 배우자. 틀려도 괜찮아, 북이가 힌트를 알려줄게!'
];

export function renderStartScreen(container) {
  const avatar = store.session.avatar;
  const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

  container.innerHTML = `
    <div class="hero-screen">
      <div class="hero-badge-pill"><span>🎮</span> 고전게임 6가지로 배우는 도서관 책 찾기</div>

      <h1 class="hero-title kid">
        숫자 암호를 풀고<br>
        <span class="gradient-text">책을 찾아라!</span>
      </h1>

      <div class="mascot-row">
        <div class="mascot" aria-hidden="true">🐛</div>
        <div class="speech-bubble">${greeting}</div>
      </div>

      <div class="glass-panel hero-card-container">
        <div class="avatar-pick-label">내 캐릭터를 골라요</div>
        <div class="avatar-grid" id="avatarGrid">
          ${AVATARS.map(a => `
            <button class="avatar-btn ${a === avatar ? 'selected' : ''}" data-avatar="${a}" aria-label="캐릭터 ${a}">${a}</button>
          `).join('')}
        </div>

        <div class="hero-btn-row">
          <button id="btnStartAdventure" class="btn-primary-large big">
            <span>🎮 게임 시작!</span>
          </button>
          <button id="btnLearnFirst" class="btn-secondary-large">
            <span>📘 먼저 배우기</span>
          </button>
        </div>
        <p class="privacy-note">🔒 이름이나 개인정보는 묻지도, 저장하지도 않아요.</p>
      </div>

      <div class="hero-features-grid">
        <div class="glass-panel hero-feature-item">
          <div class="hero-feature-icon">🏷️</div>
          <h3>책에는 주소가 있어요</h3>
          <p>책등에 붙은 작은 라벨이 <strong>청구기호</strong>! 어느 책꽂이, 몇 번째 자리에 있는지 알려주는 책의 주소예요.</p>
        </div>
        <div class="glass-panel hero-feature-item">
          <div class="hero-feature-icon">🔢</div>
          <h3>숫자 = 책의 주제</h3>
          <p>400은 과학, 800은 이야기책, 900은 역사! 앞 숫자만 봐도 어떤 책인지 알 수 있어요.</p>
        </div>
        <div class="glass-panel hero-feature-item">
          <div class="hero-feature-icon">🔤</div>
          <h3>같은 숫자면 가나다순</h3>
          <p>숫자가 같으면 글쓴이 이름 순서! 김 → 박 → 손 → 황 처럼 가나다 순서로 꽂혀 있어요.</p>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('.avatar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      soundFx.play('coin');
      const a = e.currentTarget.getAttribute('data-avatar');
      store.setAvatar(a);
      container.querySelectorAll('.avatar-btn').forEach(b => b.classList.toggle('selected', b === e.currentTarget));
      const headerAvatar = document.getElementById('headerAvatar');
      if (headerAvatar) headerAvatar.textContent = a;
      const mascot = container.querySelector('.speech-bubble');
      if (mascot) mascot.innerHTML = `${a} 멋진 선택! 그럼 <strong>게임 시작</strong>을 눌러 출발하자!`;
    });
  });

  container.querySelector('#btnStartAdventure').addEventListener('click', () => {
    soundFx.play('go');
    store.setScreen('game-select');
  });

  container.querySelector('#btnLearnFirst').addEventListener('click', () => {
    soundFx.play('click');
    store.setScreen('tutorial');
  });
}
