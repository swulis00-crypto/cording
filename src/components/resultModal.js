/**
 * 화면 컴포넌트: 결과 모달
 *  - 별점(최대 3개) + 축하 꽃가루
 *  - 틀린 문제는 '배움 카드'로 다시 보기
 *  - 점수와 이름은 어디에도 저장하지 않습니다.
 */

import { store, GAME_METADATA } from '../state/store.js';
import { soundFx } from '../audio/soundFx.js';

export function computeStars({ correctCount = 0, totalQuestions = 1 }) {
  const acc = correctCount / Math.max(1, totalQuestions);
  if (acc >= 0.999) return 3;
  if (acc >= 0.6) return 2;
  if (acc > 0) return 1;
  return 0;
}

const TITLES = {
  3: ['완벽해요! 청구기호 마스터!', '와! 책 찾기 천재!', '별 세 개! 최고예요!'],
  2: ['멋져요! 거의 다 왔어요!', '잘했어요! 한 문제만 더!', '훌륭해요! 별 두 개!'],
  1: ['좋아요! 한 번 더 해볼까요?', '첫걸음 성공! 다시 도전!', '별 하나 획득! 더 모아 봐요!'],
  0: ['괜찮아요! 북이가 도와줄게요!', '다시 하면 분명 잘될 거예요!', '힌트를 읽고 다시 도전!']
};

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function confettiHtml(count) {
  const colors = ['#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#fb7185'];
  return Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const dur = 2.2 + Math.random() * 1.4;
    const color = colors[i % colors.length];
    const size = 6 + Math.random() * 8;
    return `<i class="confetti" style="left:${left}%; animation-delay:${delay}s; animation-duration:${dur}s; background:${color}; width:${size}px; height:${size * 0.6}px;"></i>`;
  }).join('');
}

export function showResultModal(result, onReplay, onSelectOther) {
  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  const { score = 0, correctCount = 0, totalQuestions = 1, wrongNotes = [], gameId, maxCombo = 0, reason } = result;
  const stars = result.stars ?? computeStars(result);
  const meta = GAME_METADATA[gameId] || { title: '게임', icon: '🎮' };
  const title = TITLES[stars][Math.floor(Math.random() * TITLES[stars].length)];
  const avatar = store.session.avatar;

  // 같은 문제·같은 선택은 한 번만
  const seen = new Set();
  const notes = wrongNotes.filter(n => {
    const k = `${n.question}|${n.selected}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 6);

  const reasonText = reason === 'timeout' ? '⏰ 시간이 다 됐어요'
    : reason === 'lives' ? '💔 하트를 모두 잃었어요'
      : '🏁 모든 문제를 끝냈어요';

  modalContainer.innerHTML = `
    <div class="modal-backdrop open">
      ${stars >= 2 ? `<div class="confetti-layer">${confettiHtml(stars === 3 ? 60 : 30)}</div>` : ''}
      <div class="modal-window result">
        <button class="modal-close-btn" id="modalCloseBtn" aria-label="닫기">&times;</button>

        <div class="result-header">
          <div class="result-avatar">${avatar}</div>
          <div class="result-stars">
            ${[1, 2, 3].map(i => `<span class="result-star ${i <= stars ? 'on' : ''}" style="animation-delay:${0.2 * i}s">★</span>`).join('')}
          </div>
          <h2 class="result-title">${title}</h2>
          <p class="result-sub">${meta.icon} ${meta.title} · ${reasonText}</p>

          <div class="result-score-highlight">
            <div class="result-score-card">
              <div class="val">${score.toLocaleString()}</div>
              <div class="lbl">점수</div>
            </div>
            <div class="result-score-card">
              <div class="val">${correctCount} / ${totalQuestions}</div>
              <div class="lbl">맞힌 문제</div>
            </div>
            <div class="result-score-card">
              <div class="val">🔥 x${maxCombo}</div>
              <div class="lbl">최고 콤보</div>
            </div>
          </div>
          <div class="session-total">오늘 모은 별 ⭐ ${store.session.totalStars}개</div>
        </div>

        ${notes.length > 0 ? `
          <div class="result-notes-section">
            <h3><span>📝</span> 북이의 배움 카드 (틀린 문제 다시 보기)</h3>
            <div class="learn-cards">
              ${notes.map(n => `
                <div class="learn-card">
                  <div class="learn-q">${esc(n.question)}</div>
                  <div class="learn-row">
                    <span class="learn-pick">내 선택: ${esc(n.selected)}</span>
                    <span class="learn-answer">정답: ${esc(n.correct)}</span>
                  </div>
                  <div class="learn-hint">💡 ${esc(n.hint)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="result-perfect">🌟 틀린 문제가 하나도 없어요! 도서관에서도 책을 금방 찾을 수 있겠어요!</div>
        `}

        <div class="result-tip-box">
          <strong>🏛️ 진짜 도서관에서 해보기</strong><br>
          1. 검색 컴퓨터에서 읽고 싶은 책을 찾고 <strong>청구기호</strong>를 메모해요.<br>
          2. 앞 숫자(예: 813)를 보고 그 번호대 책꽂이로 가요.<br>
          3. <strong>왼쪽 → 오른쪽, 위 → 아래</strong> 순서로 번호와 가나다를 따라가면 찾을 수 있어요!
        </div>

        <div class="result-action-buttons">
          <button id="btnReplay" class="btn-primary-large"><span>🔄 다시 도전</span></button>
          <button id="btnOtherGame" class="btn-secondary-large"><span>🎮 다른 게임</span></button>
          ${notes.length > 0 ? `<button id="btnLearn" class="btn-secondary-large"><span>📘 배움터</span></button>` : ''}
        </div>
      </div>
    </div>
  `;

  soundFx.play(stars >= 2 ? 'star' : (stars === 1 ? 'victory' : 'gameover'));

  const close = () => { modalContainer.innerHTML = ''; };

  modalContainer.querySelector('#modalCloseBtn').addEventListener('click', () => {
    close();
    if (onSelectOther) onSelectOther();
  });
  modalContainer.querySelector('#btnReplay').addEventListener('click', () => {
    soundFx.play('go');
    close();
    if (onReplay) onReplay();
  });
  modalContainer.querySelector('#btnOtherGame').addEventListener('click', () => {
    soundFx.play('click');
    close();
    if (onSelectOther) onSelectOther();
    else store.setScreen('game-select');
  });
  const learnBtn = modalContainer.querySelector('#btnLearn');
  if (learnBtn) {
    learnBtn.addEventListener('click', () => {
      soundFx.play('click');
      close();
      store.setScreen('tutorial');
    });
  }
}
