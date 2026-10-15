/**
 * 게임 4: 벽돌 깨기 (Brick Breaker)
 * 미션 번호대(예: 400번대) 벽돌을 공으로 깨뜨려요!
 *  - 벽돌은 모두 같은 색! 숫자를 읽어야 미션 벽돌을 알 수 있어요
 *  - 미션 벽돌: 한 번에 깨지고 점수 + 콤보
 *  - 다른 벽돌: 두 번 맞아야 깨지고, 첫 번째 맞을 때 "이 번호는 ○○" 알려줌
 */

import { BaseGame } from './baseGame.js';
import { soundFx } from '../audio/soundFx.js';
import { ALL_DIVISIONS, getMainClass } from '../data/questionGenerator.js';

export class BrickBreakerGame extends BaseGame {
  constructor(canvas, config) {
    super(canvas, config);
    this.timeLimit = this.difficulty === 'challenge' ? 100 : 90;
    this.startLives = 3;

    this.paddle = { x: 345, y: 482, w: this.difficulty === 'challenge' ? 100 : 120, h: 16, speed: 9, dir: 0 };
    this.ball = { x: 400, y: 460, r: 8, vx: 4, vy: -5 };
    this.ballHold = 0;
    this.baseSpeed = this.difficulty === 'challenge' ? 5.4 : 4.6;
    this.bricks = [];
    this.wrongCodesNoted = new Set();

    this.keys = {};
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
  }

  setup() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerdown', this._onPointerDown);
  }

  teardown() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.style.touchAction = '';
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
  }

  renderPreview() {
    this._drawArena();
    this._drawPaddle();
  }

  /* ---------------- 문제 세팅 ---------------- */

  onQuestionLoad(q, index) {
    const targetCats = String(q.targetCategory).split('_');
    this.wrongCodesNoted = new Set();

    this.paddle.x = (this.canvasW - this.paddle.w) / 2;
    this._resetBall();
    this.ballHold = 60;

    const rows = 4;
    const cols = 8;
    const brickW = 86;
    const brickH = 30;
    const pad = 8;
    const startX = (this.canvasW - (cols * (brickW + pad) - pad)) / 2;
    const startY = 64;

    const targets = ALL_DIVISIONS.filter(d => targetCats.includes(d.classCode));
    const others = ALL_DIVISIONS.filter(d => !targetCats.includes(d.classCode));
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

    const targetCount = this.difficulty === 'challenge' ? 12 : 10;
    const picks = [];
    const tShuffled = shuffle(targets);
    for (let i = 0; i < targetCount; i++) picks.push({ ...tShuffled[i % tShuffled.length], isTarget: true });
    const oShuffled = shuffle(others);
    for (let i = 0; picks.length < rows * cols; i++) picks.push({ ...oShuffled[i % oShuffled.length], isTarget: false });
    const layout = shuffle(picks);

    this.bricks = layout.map((d, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      return {
        x: startX + c * (brickW + pad),
        y: startY + r * (brickH + pad),
        w: brickW, h: brickH,
        code: d.code,
        name: d.name,
        className: d.className,
        isTarget: d.isTarget,
        hp: d.isTarget ? 1 : 2,
        alive: true
      };
    });

    this.setClue({
      tag: `미션 ${index + 1} / ${this.questions.length} · 미션 벽돌 ${targetCount}개`,
      title: q.targetLabel,
      clue: q.missionText
    });
  }

  _resetBall() {
    const speed = this.baseSpeed + this.currentQIndex * 0.25;
    this.ball.x = this.paddle.x + this.paddle.w / 2;
    this.ball.y = this.paddle.y - 14;
    const ang = (-Math.PI / 2) + (Math.random() - 0.5) * 0.8;
    this.ball.vx = Math.cos(ang) * speed;
    this.ball.vy = Math.sin(ang) * speed;
  }

  /* ---------------- 입력 ---------------- */

  _onKeyDown(e) {
    this.keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.code)) e.preventDefault();
    if (e.code === 'Space') this.ballHold = 0;
  }
  _onKeyUp(e) { this.keys[e.code] = false; }

  _movePaddleTo(px) {
    this.paddle.x = Math.max(10, Math.min(this.canvasW - this.paddle.w - 10, px - this.paddle.w / 2));
  }

  _onPointerMove(e) {
    const p = this.pointFromEvent(e);
    this._movePaddleTo(p.x);
  }

  _onPointerDown(e) {
    e.preventDefault();
    const p = this.pointFromEvent(e);
    this._movePaddleTo(p.x);
    this.ballHold = 0;
  }

  setDirection(dx) { this.paddle.dir = dx; }
  shoot() { this.ballHold = 0; }

  /* ---------------- 로직 ---------------- */

  update() {
    const pd = this.paddle;
    const b = this.ball;

    if (this.keys.ArrowLeft || this.keys.KeyA) pd.x -= pd.speed;
    if (this.keys.ArrowRight || this.keys.KeyD) pd.x += pd.speed;
    if (pd.dir) pd.x += pd.dir * pd.speed;
    pd.x = Math.max(10, Math.min(this.canvasW - pd.w - 10, pd.x));

    if (this.ballHold > 0) {
      this.ballHold--;
      b.x = pd.x + pd.w / 2;
      b.y = pd.y - 14;
      return;
    }

    b.x += b.vx;
    b.y += b.vy;

    if (b.x - b.r < 10) { b.x = 10 + b.r; b.vx = Math.abs(b.vx); soundFx.play('hit'); }
    if (b.x + b.r > this.canvasW - 10) { b.x = this.canvasW - 10 - b.r; b.vx = -Math.abs(b.vx); soundFx.play('hit'); }
    if (b.y - b.r < 10) { b.y = 10 + b.r; b.vy = Math.abs(b.vy); soundFx.play('hit'); }

    // 패들
    if (b.vy > 0 && b.y + b.r >= pd.y && b.y - b.r <= pd.y + pd.h && b.x >= pd.x - 6 && b.x <= pd.x + pd.w + 6) {
      soundFx.play('hit');
      const speed = Math.hypot(b.vx, b.vy);
      const offset = (b.x - (pd.x + pd.w / 2)) / (pd.w / 2);
      const ang = -Math.PI / 2 + offset * 1.05;
      b.vx = Math.cos(ang) * speed;
      b.vy = Math.sin(ang) * speed;
      b.y = pd.y - b.r - 1;
    }

    // 놓침
    if (b.y > this.canvasH + 20) {
      const ended = this.loseLife({ x: pd.x + pd.w / 2, y: pd.y - 20 });
      if (!ended) {
        this._resetBall();
        this.ballHold = 50;
      }
      return;
    }

    // 벽돌 (한 프레임에 한 개만)
    for (const br of this.bricks) {
      if (!br.alive) continue;
      if (b.x + b.r > br.x && b.x - b.r < br.x + br.w && b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
        // 어느 면에 맞았는지
        const overlapX = Math.min(b.x + b.r - br.x, br.x + br.w - (b.x - b.r));
        const overlapY = Math.min(b.y + b.r - br.y, br.y + br.h - (b.y - b.r));
        if (overlapX < overlapY) b.vx = -b.vx; else b.vy = -b.vy;
        this._hitBrick(br);
        break;
      }
    }
  }

  _hitBrick(br) {
    const q = this.currentQuestion;
    const pos = { x: br.x + br.w / 2, y: br.y + br.h / 2 };

    if (br.isTarget) {
      br.alive = false;
      this.burst(pos.x, pos.y, '#fbbf24', 14);
      this.registerCorrect(60, pos, `${br.code} 깼다!`);
      const remaining = this.bricks.filter(x => x.isTarget && x.alive).length;
      if (remaining === 0) {
        this.ballHold = 9999;
        this.stageClear({
          title: '미션 완료!',
          explanation: q.explanation,
          answer: q.targetLabel
        }, 150 + Math.floor(this.timeLeft));
      } else if (remaining <= 3) {
        this.addFloat(`${remaining}개 남았어요!`, this.canvasW / 2, 250, '#fbbf24', 16);
      }
      return;
    }

    br.hp--;
    soundFx.play('bonk');
    this.burst(pos.x, pos.y, '#94a3b8', 6);
    if (br.hp <= 0) {
      br.alive = false;
    }
    const cls = getMainClass(br.code);
    const note = !this.wrongCodesNoted.has(br.code) ? {
      question: q.missionText,
      selected: `${br.code} ${br.name} (${cls.code} ${cls.name})`,
      correct: q.targetLabel,
      hint: `${br.code}은(는) ${cls.code}번대 ${cls.name}의 ${br.name} 책이에요. 미션은 ${q.targetLabel}!`
    } : null;
    if (note) this.wrongCodesNoted.add(br.code);
    this.combo = 0;
    this.score = Math.max(0, this.score - 10);
    this.addFloat(`${br.code} = ${cls.name} (-10)`, pos.x, pos.y - 10, '#fb7185', 14);
    if (note) {
      this.wrongNotes.push(note);
      if (this.config.onWrong) this.config.onWrong({ hint: note.hint });
    }
    this.emitStats();
  }

  /* ---------------- 그리기 ---------------- */

  _drawArena() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    this.rrect(10, 10, this.canvasW - 20, this.canvasH - 20, 10);
    ctx.stroke();
  }

  _drawPaddle() {
    const ctx = this.ctx;
    const pd = this.paddle;
    ctx.fillStyle = '#f59e0b';
    this.rrect(pd.x, pd.y, pd.w, pd.h, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    this.rrect(pd.x + 4, pd.y + 3, pd.w - 8, 5, 3);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(pd.x + pd.w / 2, pd.y + pd.h / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    this.emoji(this.avatar, pd.x + pd.w / 2, pd.y + pd.h / 2 + 1, 16);
  }

  render() {
    const ctx = this.ctx;
    this._drawArena();

    const q = this.currentQuestion;
    if (q) {
      this.text(`미션: ${q.targetLabel} 벽돌만 깨기!`, this.canvasW / 2, 36, { size: 15, color: '#fde68a', weight: 800 });
    }

    this.bricks.forEach(br => {
      if (!br.alive) return;
      const cracked = !br.isTarget && br.hp === 1;
      ctx.fillStyle = cracked ? '#3f4b61' : '#4b5a75';
      this.rrect(br.x, br.y, br.w, br.h, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      this.rrect(br.x + 3, br.y + 3, br.w - 6, 8, 4);
      ctx.fill();
      if (cracked) {
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(br.x + 12, br.y + 4); ctx.lineTo(br.x + 30, br.y + 16); ctx.lineTo(br.x + 24, br.y + 27);
        ctx.moveTo(br.x + 60, br.y + 3); ctx.lineTo(br.x + 52, br.y + 15); ctx.lineTo(br.x + 68, br.y + 28);
        ctx.stroke();
      }
      this.text(br.code, br.x + br.w / 2, br.y + br.h / 2 + 1, { size: 14, color: '#fff', weight: 900, font: '"Outfit", "Noto Sans KR", sans-serif' });
    });

    this._drawPaddle();

    const b = this.ball;
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.ballHold > 0 && this.ballHold < 9000) {
      this.text('탭하거나 스페이스를 눌러 발사!', this.canvasW / 2, this.paddle.y - 50, { size: 15, color: '#a5b4fc', weight: 700 });
    }
  }
}
