/**
 * 게임 6: 두더지 팡팡 (Whack-a-Mole)
 * 팻말을 잘 읽고 정답 기호를 든 두더지를 콩!
 *  - 두더지는 모두 같은 색! 팻말의 글자를 읽어야 해요
 *  - 세 번에 한 번은 꼭 정답 두더지가 나와요
 *  - 연속 정답 콤보 보너스
 */

import { BaseGame } from './baseGame.js';
import { soundFx } from '../audio/soundFx.js';

export class WhackMoleGame extends BaseGame {
  constructor(canvas, config) {
    super(canvas, config);
    this.timeLimit = 60;
    this.startLives = null;

    this.holes = [];
    this.hammer = { x: -100, y: -100, whack: 0 };
    this.spawnAcc = 0;
    this.spawnInterval = this.difficulty === 'challenge' ? 820 : 1050;
    this.stayFrames = this.difficulty === 'challenge' ? 46 : 64;
    this.spawnCount = 0;
    this.answeredThisQuestion = false;

    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
  }

  _layoutHoles() {
    const cols = 3, rows = 3, holeW = 190, holeH = 112, gapX = 36, gapY = 22;
    const startX = (this.canvasW - (cols * holeW + (cols - 1) * gapX)) / 2;
    const startY = 60;
    this.holes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.holes.push({ x: startX + c * (holeW + gapX), y: startY + r * (holeH + gapY), w: holeW, h: holeH, mole: null });
      }
    }
  }

  setup() {
    this._layoutHoles();
    this.canvas.style.cursor = 'none';
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('pointerdown', this._onDown);
    this.canvas.addEventListener('pointermove', this._onMove);
  }

  teardown() {
    this.canvas.style.cursor = '';
    this.canvas.style.touchAction = '';
    this.canvas.removeEventListener('pointerdown', this._onDown);
    this.canvas.removeEventListener('pointermove', this._onMove);
  }

  renderPreview() {
    if (!this.holes.length) this._layoutHoles();
    this._drawBoard();
  }

  /* ---------------- 문제 세팅 ---------------- */

  onQuestionLoad(q, index) {
    this.holes.forEach(h => { h.mole = null; });
    this.spawnAcc = this.spawnInterval; // 바로 첫 두더지 등장
    this.spawnCount = 0;
    this.answeredThisQuestion = false;
    this.setClue({
      tag: `문제 ${index + 1} / ${this.questions.length} · 팻말을 잘 읽어요!`,
      title: '정답 두더지를 찾아 콩!',
      clue: q.prompt
    });
  }

  /* ---------------- 입력 ---------------- */

  _onMove(e) {
    const p = this.pointFromEvent(e);
    this.hammer.x = p.x;
    this.hammer.y = p.y;
  }

  _onDown(e) {
    e.preventDefault();
    const p = this.pointFromEvent(e);
    this.hammer.x = p.x;
    this.hammer.y = p.y;
    if (!this.isRunning || this.isPaused || this.answeredThisQuestion) return;

    soundFx.play('whack');
    this.hammer.whack = 10;
    const q = this.currentQuestion;

    for (const hole of this.holes) {
      const m = hole.mole;
      if (!m || m.state === 'hit') continue;
      const top = hole.y + hole.h - m.height - 26; // 팻말 포함
      if (p.x >= hole.x + 16 && p.x <= hole.x + hole.w - 16 && p.y >= top && p.y <= hole.y + hole.h) {
        m.state = 'hit';
        const pos = { x: hole.x + hole.w / 2, y: hole.y + hole.h - m.height };
        if (m.isTarget) {
          this.answeredThisQuestion = true;
          this.registerCorrect(150 + this.timeLeft, pos, `콩! ${m.code}`);
          this.holes.forEach(h => { if (h.mole && h.mole !== m) h.mole.state = 'hiding'; });
          this.stageClear({ quick: true, title: `정답! ${m.code}`, explanation: q.explanation });
        } else {
          this.registerWrong(40, {
            question: q.prompt,
            selected: `${m.code} (${m.desc})`,
            correct: q.targetCode,
            hint: q.explanation
          }, pos);
        }
        return;
      }
    }
    // 허공 치기
    this.addFloat('휙!', p.x, p.y - 20, '#94a3b8', 14);
  }

  /* ---------------- 로직 ---------------- */

  update(dt) {
    const q = this.currentQuestion;
    if (!q) return;

    this.spawnAcc += dt;
    if (this.spawnAcc >= this.spawnInterval && !this.answeredThisQuestion) {
      this.spawnAcc = 0;
      const empty = this.holes.filter(h => !h.mole);
      if (empty.length) {
        const hole = empty[Math.floor(Math.random() * empty.length)];
        this.spawnCount++;
        const targetShowing = this.holes.some(h => h.mole && h.mole.isTarget && h.mole.state !== 'hit');
        const forceTarget = !targetShowing && (this.spawnCount % 3 === 0 || Math.random() < 0.3);
        const pool = forceTarget ? q.moles.filter(m => m.isTarget) : q.moles.filter(m => !m.isTarget);
        const data = pool[Math.floor(Math.random() * pool.length)] || q.moles[0];
        hole.mole = {
          code: data.code, isTarget: data.isTarget, desc: data.desc,
          height: 0, maxHeight: 72, state: 'rising', timer: 0, face: '🐹'
        };
      }
    }

    this.holes.forEach(h => {
      const m = h.mole;
      if (!m) return;
      if (m.state === 'rising') {
        m.height += 7;
        if (m.height >= m.maxHeight) { m.height = m.maxHeight; m.state = 'stay'; m.timer = 0; }
      } else if (m.state === 'stay') {
        m.timer++;
        if (m.timer > this.stayFrames) m.state = 'hiding';
      } else if (m.state === 'hiding') {
        m.height -= 6;
        if (m.height <= 0) h.mole = null;
      } else if (m.state === 'hit') {
        m.height -= 9;
        if (m.height <= 0) h.mole = null;
      }
    });

    if (this.hammer.whack > 0) this.hammer.whack--;
  }

  /* ---------------- 그리기 ---------------- */

  _drawBoard() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    // 카펫 무늬
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 20; i++) ctx.fillRect(0, i * 52, this.canvasW, 26);

    this.text('팻말을 잘 읽고 정답 두더지를 콩!', this.canvasW / 2, 32, { size: 16, color: '#c7d2fe', weight: 800 });

    this.holes.forEach(h => {
      ctx.fillStyle = '#0f172a';
      this.rrect(h.x, h.y, h.w, h.h, 18);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }

  render() {
    const ctx = this.ctx;
    this._drawBoard();

    this.holes.forEach(h => {
      const m = h.mole;
      if (m) {
        const baseY = h.y + h.h - m.height;
        ctx.save();
        this.rrect(h.x + 6, h.y - 40, h.w - 12, h.h + 40, 18);
        ctx.clip();

        // 두더지 몸 (모두 같은 색)
        ctx.fillStyle = m.state === 'hit' ? '#94a3b8' : '#a16207';
        ctx.beginPath();
        ctx.ellipse(h.x + h.w / 2, baseY + 40, 46, 44, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = m.state === 'hit' ? '#cbd5e1' : '#d4a373';
        ctx.beginPath();
        ctx.ellipse(h.x + h.w / 2, baseY + 50, 24, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        this.emoji(m.state === 'hit' ? '😵' : '🤓', h.x + h.w / 2, baseY + 26, 24);

        // 팻말
        ctx.fillStyle = '#fef3c7';
        this.rrect(h.x + h.w / 2 - 62, baseY - 26, 124, 34, 7);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.stroke();
        this.text(m.code, h.x + h.w / 2, baseY - 9, { size: 21, color: '#1e293b', weight: 900, font: '"Outfit", "Noto Sans KR", sans-serif' });

        ctx.restore();
      }

      // 구멍 앞 테두리
      ctx.fillStyle = '#1e293b';
      this.rrect(h.x - 2, h.y + h.h - 10, h.w + 4, 16, 6);
      ctx.fill();
    });

    // 뿅망치
    ctx.save();
    ctx.translate(this.hammer.x, this.hammer.y);
    ctx.rotate(this.hammer.whack > 0 ? -0.7 : -0.2);
    this.emoji('🔨', 0, 0, 36);
    ctx.restore();
  }
}
