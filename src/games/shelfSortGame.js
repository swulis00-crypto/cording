/**
 * 게임 2: 책꽂이 정리 (Shelf Sort)
 * 뒤섞인 책을 서가 배열 규칙(분류번호 → 저자기호 → 권차)대로 정리하는 퍼즐
 *  - 책을 끌어서(드래그) 옮기거나, 두 권을 차례로 눌러 자리 바꾸기
 *  - "확인!" 을 누르면 칸마다 ✓/✗ 로 바로 알려줌
 *  - 세 번 틀리면 정답 순서를 보여주고 다음 문제로
 */

import { BaseGame } from './baseGame.js';
import { soundFx } from '../audio/soundFx.js';

const BOOK_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];

export class ShelfSortGame extends BaseGame {
  constructor(canvas, config) {
    super(canvas, config);
    this.timeLimit = this.difficulty === 'challenge' ? 110 : 90;
    this.startLives = null;

    this.items = [];
    this.slots = [];
    this.selectedIndex = null;
    this.hoverIndex = null;
    this.drag = null;
    this.marks = null;
    this.marksTimer = 0;
    this.attempts = 0;
    this.revealing = false;
    this.checkBtn = { x: 300, y: 446, w: 200, h: 52 };

    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
  }

  setup() {
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('pointerdown', this._onDown);
    this.canvas.addEventListener('pointermove', this._onMove);
    this.canvas.addEventListener('pointerup', this._onUp);
    this.canvas.addEventListener('pointercancel', this._onUp);
  }

  teardown() {
    this.canvas.style.touchAction = '';
    this.canvas.removeEventListener('pointerdown', this._onDown);
    this.canvas.removeEventListener('pointermove', this._onMove);
    this.canvas.removeEventListener('pointerup', this._onUp);
    this.canvas.removeEventListener('pointercancel', this._onUp);
  }

  renderPreview() {
    this._drawShelf();
  }

  /* ---------------- 문제 세팅 ---------------- */

  onQuestionLoad(q, index) {
    const raw = JSON.parse(JSON.stringify(q.items));
    this.items = this._shuffle(raw);
    this.selectedIndex = null;
    this.hoverIndex = null;
    this.drag = null;
    this.marks = null;
    this.marksTimer = 0;
    this.attempts = 0;
    this.revealing = false;

    const count = this.items.length;
    const gap = 14;
    const blockW = Math.min(132, Math.floor((this.canvasW - 120 - gap * (count - 1)) / count));
    const startX = (this.canvasW - (count * blockW + gap * (count - 1))) / 2;
    this.slots = [];
    for (let i = 0; i < count; i++) {
      this.slots.push({ x: startX + i * (blockW + gap), y: 170, w: blockW, h: 225 });
    }

    this.setClue({
      tag: `책꽂이 ${index + 1} / ${this.questions.length}`,
      title: q.title,
      clue: q.instructions
    });
  }

  _shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    if (copy.every((it, idx) => it.rank === idx + 1) && copy.length > 1) {
      [copy[0], copy[1]] = [copy[1], copy[0]];
    }
    return copy;
  }

  /* ---------------- 입력 ---------------- */

  _slotAt(x, y) {
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (x >= s.x - 7 && x <= s.x + s.w + 7 && y >= s.y - 20 && y <= s.y + s.h + 10) return i;
    }
    return null;
  }

  _inCheckBtn(x, y) {
    const b = this.checkBtn;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  _onDown(e) {
    if (!this.isRunning || this.isPaused || this.revealing) return;
    e.preventDefault();
    const p = this.pointFromEvent(e);
    if (this._inCheckBtn(p.x, p.y)) {
      this.checkSolution();
      return;
    }
    const idx = this._slotAt(p.x, p.y);
    if (idx !== null) {
      this.drag = { index: idx, x: p.x, y: p.y, startX: p.x, startY: p.y, moved: false };
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }

  _onMove(e) {
    const p = this.pointFromEvent(e);
    this.hoverIndex = this._slotAt(p.x, p.y);
    if (this.drag) {
      this.drag.x = p.x;
      this.drag.y = p.y;
      if (Math.hypot(p.x - this.drag.startX, p.y - this.drag.startY) > 10) this.drag.moved = true;
    }
  }

  _onUp(e) {
    if (!this.drag) return;
    const p = this.pointFromEvent(e);
    const d = this.drag;
    this.drag = null;
    if (this.isPaused || this.revealing) return;

    if (!d.moved) {
      // 탭: 두 권 차례로 눌러 자리 바꾸기
      soundFx.play('click');
      if (this.selectedIndex === null) {
        this.selectedIndex = d.index;
      } else if (this.selectedIndex === d.index) {
        this.selectedIndex = null;
      } else {
        const a = this.selectedIndex;
        [this.items[a], this.items[d.index]] = [this.items[d.index], this.items[a]];
        this.selectedIndex = null;
        this.marks = null;
      }
      return;
    }

    // 드래그: 놓은 칸으로 끼워 넣기
    const target = this._slotAt(p.x, p.y);
    if (target !== null && target !== d.index) {
      const [moved] = this.items.splice(d.index, 1);
      this.items.splice(target, 0, moved);
      this.selectedIndex = null;
      this.marks = null;
      soundFx.play('click');
    }
  }

  /* ---------------- 정답 확인 ---------------- */

  checkSolution() {
    if (!this.isRunning || this.isPaused || this.revealing) return;
    const q = this.currentQuestion;
    const marks = this.items.map((it, idx) => it.rank === idx + 1);
    const allCorrect = marks.every(Boolean);

    if (allCorrect) {
      this.marks = marks;
      this.marksTimer = 9999;
      const center = { x: this.canvasW / 2, y: 140 };
      const pts = this.registerCorrect(200 + Math.floor(this.timeLeft * 1.5) - this.attempts * 30, center, '완벽해요!');
      void pts;
      setTimeout(() => {
        this.stageClear({
          title: '책꽂이 정리 완료!',
          explanation: q.explanation,
          answer: q.items.map(i => `${i.code} ${i.authorNo || i.author || ''}`.trim()).join('  →  ')
        }, 80);
      }, 500);
      return;
    }

    this.attempts++;
    this.marks = marks;
    this.marksTimer = 110;
    const correctCount = marks.filter(Boolean).length;
    const note = this.attempts === 1 ? {
      question: q.instructions,
      selected: this.items.map(i => i.code).join(' → '),
      correct: q.items.map(i => i.code).join(' → '),
      hint: q.explanation
    } : null;
    this.registerWrong(30, note, { x: this.canvasW / 2, y: 140 });
    this.addFloat(`${correctCount}권은 제자리! ✓`, this.canvasW / 2, 110, '#fbbf24', 16);

    if (this.attempts >= 3) {
      this.revealing = true;
      this.items = [...q.items].sort((a, b) => a.rank - b.rank);
      this.marks = this.items.map(() => true);
      this.marksTimer = 9999;
      this.setClue({ tag: '정답 순서를 잘 봐요!', title: q.title, clue: q.explanation });
      setTimeout(() => {
        this.stageSkip({
          title: '정답 순서를 확인해요',
          explanation: q.explanation,
          answer: q.items.map(i => `${i.code} ${i.authorNo || i.author || ''}`.trim()).join('  →  ')
        });
      }, 1800);
    }
  }

  /* ---------------- 로직 / 그리기 ---------------- */

  update() {
    if (this.marks && this.marksTimer > 0) {
      this.marksTimer--;
      if (this.marksTimer <= 0 && !this.revealing) this.marks = null;
    }
  }

  _drawShelf() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    // 책장 틀
    ctx.fillStyle = '#7c3f12';
    this.rrect(28, 130, this.canvasW - 56, 300, 10);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(44, 146, this.canvasW - 88, 254);

    // 선반
    ctx.fillStyle = '#b45309';
    ctx.fillRect(36, 398, this.canvasW - 72, 16);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(36, 414, this.canvasW - 72, 8);

    // 왼쪽/오른쪽 안내
    this.text('◀ 작은 번호', 92, 120, { size: 13, color: '#a5b4fc' });
    this.text('큰 번호 ▶', this.canvasW - 92, 120, { size: 13, color: '#a5b4fc' });
  }

  _drawBook(item, x, y, w, h, color, lifted) {
    const ctx = this.ctx;
    const yy = lifted ? y - 12 : y;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    this.rrect(x + 4, yy + 6, w, h, 6);
    ctx.fill();

    ctx.fillStyle = color;
    this.rrect(x, yy, w, h, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x, yy, 9, h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x + w - 8, yy + 4, 4, h - 8);

    // 제목 (최대 2줄)
    const title = item.title || '';
    const chunk = Math.max(4, Math.floor((w - 24) / 14));
    const lines = [title.slice(0, chunk), title.slice(chunk, chunk * 2 - 1) + (title.length > chunk * 2 - 1 ? '…' : '')].filter(Boolean);
    lines.forEach((ln, i) => {
      this.text(ln, x + w / 2 + 3, yy + 34 + i * 20, { size: 14, color: '#fff', weight: 700 });
    });

    // 청구기호 라벨
    const labelH = 70;
    ctx.fillStyle = '#fffbeb';
    this.rrect(x + 10, yy + h - labelH - 12, w - 20, labelH, 4);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    this.text(String(item.code || ''), x + w / 2, yy + h - labelH + 10, { size: 19, color: '#0f172a', weight: 900, font: '"Outfit", "Noto Sans KR", sans-serif' });
    this.text(item.authorNo || item.author || '', x + w / 2, yy + h - labelH + 36, { size: 13, color: '#1e293b', weight: 700 });
    if (item.volume) {
      this.text(item.volume, x + w / 2, yy + h - labelH + 54, { size: 11, color: '#64748b', weight: 700 });
    }
  }

  render() {
    const ctx = this.ctx;
    this._drawShelf();

    this.text('책을 끌어서 옮기거나, 두 권을 차례로 눌러 자리를 바꿔요', this.canvasW / 2, 70, { size: 15, color: '#e2e8f0' });
    this.text('다 정리했으면 아래 "확인!" 버튼을 눌러요', this.canvasW / 2, 94, { size: 13, color: '#94a3b8', weight: 500 });

    this.slots.forEach((slot, idx) => {
      const item = this.items[idx];
      const isSel = this.selectedIndex === idx;
      const isHover = this.hoverIndex === idx && (this.drag ? this.drag.index !== idx : true);
      const isDragging = this.drag && this.drag.index === idx;

      // 칸
      ctx.fillStyle = isHover && this.drag ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)';
      this.rrect(slot.x - 4, slot.y - 6, slot.w + 8, slot.h + 12, 8);
      ctx.fill();
      if (isSel || (isHover && !this.drag)) {
        ctx.strokeStyle = isSel ? '#f472b6' : 'rgba(165,180,252,0.6)';
        ctx.lineWidth = isSel ? 3 : 1.5;
        ctx.stroke();
      }

      // 칸 번호
      this.text(`${idx + 1}번 칸`, slot.x + slot.w / 2, slot.y + slot.h + 24, { size: 12, color: '#64748b', weight: 600 });

      if (item && !isDragging) {
        this._drawBook(item, slot.x, slot.y, slot.w, slot.h, BOOK_COLORS[(item.rank || idx) % BOOK_COLORS.length], isSel);
      }

      // ✓ / ✗ 표시
      if (this.marks && this.marks[idx] !== undefined && item) {
        const ok = this.marks[idx];
        ctx.fillStyle = ok ? '#10b981' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(slot.x + slot.w / 2, slot.y - 2, 16, 0, Math.PI * 2);
        ctx.fill();
        this.text(ok ? '✓' : '✗', slot.x + slot.w / 2, slot.y - 1, { size: 18, color: '#fff', weight: 900 });
      }
    });

    // 드래그 중인 책
    if (this.drag && this.items[this.drag.index]) {
      const item = this.items[this.drag.index];
      const slot = this.slots[this.drag.index];
      const w = slot.w, h = slot.h;
      ctx.save();
      ctx.globalAlpha = 0.95;
      this._drawBook(item, this.drag.x - w / 2, this.drag.y - h / 2, w, h, BOOK_COLORS[(item.rank || 0) % BOOK_COLORS.length], true);
      ctx.restore();
    }

    // 확인 버튼
    const b = this.checkBtn;
    const hoverBtn = !this.revealing;
    ctx.fillStyle = hoverBtn ? '#10b981' : '#475569';
    this.rrect(b.x, b.y, b.w, b.h, 14);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.rrect(b.x + 4, b.y + 4, b.w - 8, b.h / 2 - 4, 10);
    ctx.fill();
    this.text(this.revealing ? '정답 순서 보기' : '확인! ✓', b.x + b.w / 2, b.y + b.h / 2, { size: 19, color: '#fff', weight: 900 });

    if (this.attempts > 0 && !this.revealing) {
      this.text(`시도 ${this.attempts} / 3`, this.canvasW - 70, 470, { size: 12, color: '#fbbf24', weight: 700 });
    }
  }
}
