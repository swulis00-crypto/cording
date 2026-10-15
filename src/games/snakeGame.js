/**
 * 게임 5: 책벌레 뱀 (Snake)
 * 번호가 작은 책부터 차례대로 먹어 몸을 길게!
 *  - 지금 먹어야 하는 책은 반짝이고 "다음!" 표시
 *  - 순서가 틀린 책을 먹으면 감점 + 힌트
 *  - 내 몸에 부딪히면 하트 하나 잃고 몸이 짧아져요
 *  - 화면 끝에서는 반대편으로 통과(워프)
 */

import { BaseGame } from './baseGame.js';

export class SnakeGame extends BaseGame {
  constructor(canvas, config) {
    super(canvas, config);
    this.canvasH = 512;
    this.timeLimit = this.difficulty === 'challenge' ? 90 : 80;
    this.startLives = 3;

    this.cols = 25;
    this.rows = 16;
    this.cell = this.canvasW / this.cols;

    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.items = [];
    this.currentStep = 1;
    this.tickInterval = this.difficulty === 'challenge' ? 125 : 155;
    this.acc = 0;
    this.grow = 0;
    this.lastWrongKey = null;

    this._onKey = this._onKey.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this.touchStart = null;
  }

  setup() {
    window.addEventListener('keydown', this._onKey);
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: true });
  }

  teardown() {
    window.removeEventListener('keydown', this._onKey);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
  }

  renderPreview() {
    this._drawFloor();
  }

  /* ---------------- 문제 세팅 ---------------- */

  onQuestionLoad(q, index) {
    this.snake = [{ x: 6, y: 8 }, { x: 5, y: 8 }, { x: 4, y: 8 }];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.currentStep = 1;
    this.acc = 0;
    this.grow = 0;
    this.lastWrongKey = null;
    this.tickInterval = Math.max(90, (this.difficulty === 'challenge' ? 125 : 155) - index * 8);

    const used = new Set(this.snake.map(s => `${s.x},${s.y}`));
    for (let x = 4; x <= 12; x++) used.add(`${x},8`); // 출발 직선 비우기
    this.items = [];
    q.sequence.forEach(item => {
      let rx, ry, tries = 0;
      do {
        rx = Math.floor(Math.random() * (this.cols - 4)) + 2;
        ry = Math.floor(Math.random() * (this.rows - 4)) + 2;
        tries++;
      } while (
        tries < 200 &&
        (used.has(`${rx},${ry}`) || this.items.some(it => Math.abs(it.x - rx) + Math.abs(it.y - ry) < 4))
      );
      used.add(`${rx},${ry}`);
      this.items.push({ x: rx, y: ry, code: item.code, label: item.label, order: item.order, collected: false });
    });

    this.setClue({
      tag: `코스 ${index + 1} / ${this.questions.length} · 작은 번호부터!`,
      title: q.title,
      clue: `순서: ${q.sequence.map(s => s.label).join('  →  ')}`
    });
  }

  /* ---------------- 입력 ---------------- */

  _onKey(e) {
    const map = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    const d = map[e.code];
    if (d) { e.preventDefault(); this.setDirection(d[0], d[1]); }
  }

  setDirection(dx, dy) {
    if (dx !== 0 && this.dir.x === 0) this.nextDir = { x: dx, y: 0 };
    if (dy !== 0 && this.dir.y === 0) this.nextDir = { x: 0, y: dy };
  }

  _onTouchStart(e) {
    const t = e.touches[0];
    this.touchStart = { x: t.clientX, y: t.clientY };
  }

  _onTouchEnd(e) {
    if (!this.touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStart.x;
    const dy = t.clientY - this.touchStart.y;
    this.touchStart = null;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) this.setDirection(dx > 0 ? 1 : -1, 0);
    else this.setDirection(0, dy > 0 ? 1 : -1);
  }

  /* ---------------- 로직 ---------------- */

  update(dt) {
    this.acc += dt;
    while (this.acc >= this.tickInterval) {
      this.acc -= this.tickInterval;
      this._step();
      if (this.isPaused || !this.isRunning) break;
    }
  }

  _step() {
    this.dir = { ...this.nextDir };
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
    if (head.x < 0) head.x = this.cols - 1;
    if (head.x >= this.cols) head.x = 0;
    if (head.y < 0) head.y = this.rows - 1;
    if (head.y >= this.rows) head.y = 0;

    // 내 몸과 충돌
    if (this.snake.some((s, i) => i > 0 && s.x === head.x && s.y === head.y)) {
      const px = head.x * this.cell + this.cell / 2;
      const py = head.y * this.cell + this.cell / 2;
      const ended = this.loseLife({ x: px, y: py });
      if (!ended) {
        this.snake = this.snake.slice(0, 3);
        this.addFloat('몸이 짧아졌어요!', px, py - 24, '#fb7185', 15);
      }
      return;
    }

    this.snake.unshift(head);

    const q = this.currentQuestion;
    const item = this.items.find(it => !it.collected && it.x === head.x && it.y === head.y);
    if (item) {
      const px = head.x * this.cell + this.cell / 2;
      const py = head.y * this.cell + this.cell / 2;
      if (item.order === this.currentStep) {
        item.collected = true;
        this.grow += 2;
        this.registerCorrect(100 + this.snake.length * 4, { x: px, y: py }, `${item.code} 냠!`);
        this.currentStep++;
        if (this.currentStep > q.sequence.length) {
          this.stageClear({
            title: '코스 완주!',
            explanation: q.explanation,
            answer: q.sequence.map(s => s.code).join('  →  ')
          }, 120 + Math.floor(this.timeLeft));
          return;
        }
      } else {
        const expected = q.sequence.find(s => s.order === this.currentStep);
        const key = `${item.code}-${this.currentStep}`;
        const note = this.lastWrongKey !== key ? {
          question: `${q.title} (${q.sequence.map(s => s.code).join(' → ')})`,
          selected: `${item.label}을(를) ${this.currentStep}번째로 먹음`,
          correct: expected ? `${this.currentStep}번째는 ${expected.label}` : '',
          hint: q.explanation
        } : null;
        this.lastWrongKey = key;
        this.registerWrong(30, note, { x: px, y: py });
        this.addFloat(expected ? `먼저 ${expected.code}!` : '순서가 달라요', px, py - 26, '#fbbf24', 15);
      }
    }

    if (this.grow > 0) {
      this.grow--;
    } else {
      this.snake.pop();
    }
  }

  /* ---------------- 그리기 ---------------- */

  _drawFloor() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * this.cell, 0); ctx.lineTo(c * this.cell, this.canvasH); ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * this.cell); ctx.lineTo(this.canvasW, r * this.cell); ctx.stroke();
    }
  }

  render() {
    const ctx = this.ctx;
    this._drawFloor();
    const cs = this.cell;

    // 책 아이템
    this.items.forEach(it => {
      if (it.collected) return;
      const cx = it.x * cs + cs / 2;
      const cy = it.y * cs + cs / 2;
      const isNext = it.order === this.currentStep;

      if (isNext) {
        const pulse = 0.5 + 0.5 * Math.sin(this._frame / 6);
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + pulse * 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(20,184,166,${0.18 + pulse * 0.2})`;
        ctx.fill();
        this.text('다음!', cx, cy - 25, { size: 12, color: '#5eead4', weight: 900 });
      }

      ctx.fillStyle = isNext ? '#14b8a6' : '#64748b';
      this.rrect(it.x * cs + 3, it.y * cs + 3, cs - 6, cs - 6, 6);
      ctx.fill();
      this.text(String(it.order), cx, cy, { size: 15, color: '#fff', weight: 900 });
      // 번호 배지 (칸보다 넓게, 블록 아래)
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      this.rrect(cx - 26, cy + cs / 2 - 4, 52, 18, 5);
      ctx.fill();
      this.text(it.code, cx, cy + cs / 2 + 5, { size: 12, color: '#0f172a', weight: 900, font: '"Outfit", sans-serif' });
    });

    // 뱀
    const len = this.snake.length;
    this.snake.forEach((seg, i) => {
      const sx = seg.x * cs + 2;
      const sy = seg.y * cs + 2;
      const sz = cs - 4;
      if (i === 0) {
        ctx.fillStyle = '#10b981';
        this.rrect(sx - 1, sy - 1, sz + 2, sz + 2, 10);
        ctx.fill();
        this.emoji(this.avatar, sx + sz / 2, sy + sz / 2 + 1, 20);
      } else {
        const t = i / Math.max(1, len);
        ctx.fillStyle = i % 2 === 0 ? `rgba(5,150,105,${1 - t * 0.4})` : `rgba(52,211,153,${1 - t * 0.4})`;
        this.rrect(sx, sy, sz, sz, 8);
        ctx.fill();
      }
    });

    this.text(`길이 ${len}`, this.canvasW - 50, 18, { size: 13, color: '#94a3b8', weight: 700 });
  }
}
