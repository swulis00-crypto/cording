/**
 * 게임 3: 외계인 격퇴 (Space Invaders)
 * 주제에 맞는 분류번호를 단 외계인만 레이저로 격추!
 *  - 모든 외계인은 같은 색! 번호를 읽어야만 정답을 찾을 수 있어요
 *  - 다른 외계인을 쏘면 하트 하나 잃음
 *  - 도전 모드에서는 외계인이 폭탄을 떨어뜨림
 */

import { BaseGame } from './baseGame.js';
import { soundFx } from '../audio/soundFx.js';
import { getDivision } from '../data/questionGenerator.js';

export class SpaceDefenseGame extends BaseGame {
  constructor(canvas, config) {
    super(canvas, config);
    this.timeLimit = this.difficulty === 'challenge' ? 80 : 70;
    this.startLives = 3;

    this.ship = { x: 376, y: 455, w: 48, h: 34, speed: 6.5, dir: 0 };
    this.lasers = [];
    this.aliens = [];
    this.bombs = [];
    this.fleetDir = 1;
    this.fleetSpeed = 1;
    this.waveClearing = false;
    this.bombTimer = 0;
    this.stars = Array.from({ length: 70 }, () => ({
      x: Math.random() * 800, y: Math.random() * 520, r: Math.random() * 1.5 + 0.5, tw: Math.random() * Math.PI * 2
    }));

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
    this._drawSpace();
    this._drawShip();
  }

  /* ---------------- 문제 세팅 ---------------- */

  onQuestionLoad(q, index) {
    this.aliens = [];
    this.lasers = [];
    this.bombs = [];
    this.waveClearing = false;
    this.bombTimer = 0;

    const options = [...q.options];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    const perRow = options.length > 4 ? 3 : options.length;
    const spacing = 150;
    options.forEach((code, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const rowCount = Math.min(perRow, options.length - row * perRow);
      const startX = (this.canvasW - (rowCount * spacing - (spacing - 70))) / 2;
      this.aliens.push({
        x: startX + col * spacing,
        y: 70 + row * 72,
        w: 78, h: 54,
        code,
        isTarget: code === q.targetClass,
        alive: true,
        wob: Math.random() * Math.PI * 2
      });
    });

    this.fleetDir = Math.random() > 0.5 ? 1 : -1;
    this.fleetSpeed = (this.difficulty === 'challenge' ? 1.5 : 1.0) + index * 0.18;

    if (!q.targetName) {
      const div = getDivision(q.targetClass);
      if (div) q.targetName = div.name;
    }
    this.setClue({
      tag: `웨이브 ${index + 1} / ${this.questions.length} · 번호를 잘 읽고 쏘세요!`,
      title: `목표: ${q.targetName || q.targetClass}`,
      clue: q.clue
    });
  }

  /* ---------------- 입력 ---------------- */

  _onKeyDown(e) {
    this.keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.code)) e.preventDefault();
    if (e.code === 'Space' || e.code === 'ArrowUp') this.shoot();
  }

  _onKeyUp(e) { this.keys[e.code] = false; }

  _onPointerMove(e) {
    // 마우스는 버튼을 누른 채 움직일 때만, 터치/펜은 항상 따라가기
    if (e.pointerType === 'mouse' && e.buttons === 0) return;
    const p = this.pointFromEvent(e);
    this.ship.x = Math.max(10, Math.min(this.canvasW - this.ship.w - 10, p.x - this.ship.w / 2));
  }

  _onPointerDown(e) {
    e.preventDefault();
    const p = this.pointFromEvent(e);
    // 탭한 자리로 이동 + 발사
    this.ship.x = Math.max(10, Math.min(this.canvasW - this.ship.w - 10, p.x - this.ship.w / 2));
    this.shoot();
  }

  setDirection(dx) { this.ship.dir = dx; }

  shoot() {
    if (!this.isRunning || this.isPaused || this.waveClearing) return;
    if (this.lasers.length >= 3) return;
    soundFx.play('laser');
    this.lasers.push({ x: this.ship.x + this.ship.w / 2 - 2, y: this.ship.y - 10, w: 4, h: 16, speed: 10 });
  }

  /* ---------------- 로직 ---------------- */

  update() {
    const s = this.ship;
    if (this.keys.ArrowLeft || this.keys.KeyA) s.x -= s.speed;
    if (this.keys.ArrowRight || this.keys.KeyD) s.x += s.speed;
    if (s.dir) s.x += s.dir * s.speed;
    s.x = Math.max(10, Math.min(this.canvasW - s.w - 10, s.x));

    // 레이저
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y -= l.speed;
      let hit = false;
      if (!this.waveClearing) {
        for (const a of this.aliens) {
          if (!a.alive) continue;
          if (l.x < a.x + a.w && l.x + l.w > a.x && l.y < a.y + a.h && l.y + l.h > a.y) {
            hit = true;
            this._hitAlien(a);
            break;
          }
        }
      }
      if (this.waveClearing) {
        // 정답 명중: 남은 레이저는 모두 지우고 이 프레임의 레이저 처리를 끝냄
        this.lasers = [];
        break;
      }
      if (hit || l.y < -20) this.lasers.splice(i, 1);
    }

    // 함대 이동
    if (!this.waveClearing) {
      let edge = false;
      this.aliens.forEach(a => {
        if (!a.alive) return;
        a.x += this.fleetDir * this.fleetSpeed;
        if (a.x < 16 || a.x + a.w > this.canvasW - 16) edge = true;
      });
      if (edge) {
        this.fleetDir *= -1;
        this.aliens.forEach(a => { a.y += 14; });
      }
      // 바닥 근접 → 하트 잃고 함대 위로 리셋
      const lowest = Math.max(...this.aliens.filter(a => a.alive).map(a => a.y + a.h), 0);
      if (lowest > s.y - 20) {
        const ended = this.loseLife({ x: s.x + s.w / 2, y: s.y });
        if (!ended) {
          this.addFloat('외계인이 너무 가까워요!', this.canvasW / 2, 300, '#fb7185', 18);
          const shift = lowest - 150; // 가장 낮은 외계인이 y=150 근처로 올라가도록
          this.aliens.forEach(a => { a.y -= shift; });
          this.bombs = [];
        }
      }

      // 폭탄 (도전 모드)
      if (this.difficulty === 'challenge') {
        this.bombTimer++;
        if (this.bombTimer > 95) {
          this.bombTimer = 0;
          const alive = this.aliens.filter(a => a.alive);
          if (alive.length) {
            const a = alive[Math.floor(Math.random() * alive.length)];
            this.bombs.push({ x: a.x + a.w / 2, y: a.y + a.h, vy: 3.2 });
          }
        }
      }
    }

    // 폭탄 이동
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.y += b.vy;
      if (b.x > s.x && b.x < s.x + s.w && b.y > s.y && b.y < s.y + s.h) {
        this.bombs.splice(i, 1);
        this.loseLife({ x: s.x + s.w / 2, y: s.y });
        continue;
      }
      if (b.y > this.canvasH + 10) this.bombs.splice(i, 1);
    }
  }

  _hitAlien(a) {
    const q = this.currentQuestion;
    const pos = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    a.alive = false;
    this.burst(pos.x, pos.y, '#c4b5fd', 24);

    if (a.isTarget) {
      soundFx.play('explosion');
      this.waveClearing = true;
      this.registerCorrect(150 + this.timeLeft, pos, `명중! ${a.code}`);
      this.stageClear({ quick: true, title: `명중! ${a.code} ${q.targetName || ''}`, explanation: q.explanation });
      return;
    }

    const div = getDivision(a.code);
    const name = div ? `${a.code}은(는) ${div.name}` : `${a.code}`;
    this.addFloat(`앗! ${name}`, pos.x, pos.y - 20, '#fb7185', 16);
    this.wrongNotes.push({
      question: q.clue,
      selected: `${a.code}${div ? ` (${div.name})` : ''}`,
      correct: `${q.targetClass}${q.targetName ? ` (${q.targetName})` : ''}`,
      hint: q.explanation
    });
    if (this.config.onWrong) this.config.onWrong({ hint: `${name} 책이에요. 목표는 ${q.targetClass}!` });
    this.combo = 0;
    this.loseLife(pos);
  }

  /* ---------------- 그리기 ---------------- */

  _drawSpace() {
    const ctx = this.ctx;
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    this.stars.forEach(st => {
      const a = 0.35 + 0.35 * Math.sin(this._frame / 20 + st.tw);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(st.x, (st.y + this._frame * 0.15) % this.canvasH, st.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  _drawShip() {
    const ctx = this.ctx;
    const s = this.ship;
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.moveTo(s.x + s.w / 2, s.y);
    ctx.lineTo(s.x + s.w, s.y + s.h);
    ctx.lineTo(s.x, s.y + s.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(s.x + s.w / 2 - 3, s.y - 8, 6, 10);
    // 조종사(아바타)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + 20, 11, 0, Math.PI * 2);
    ctx.fill();
    this.emoji(this.avatar, s.x + s.w / 2, s.y + 21, 15);
    // 엔진 불꽃
    const fl = 6 + Math.random() * 6;
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(s.x + s.w / 2 - 8, s.y + s.h);
    ctx.lineTo(s.x + s.w / 2, s.y + s.h + fl);
    ctx.lineTo(s.x + s.w / 2 + 8, s.y + s.h);
    ctx.closePath();
    ctx.fill();
  }

  render() {
    const ctx = this.ctx;
    this._drawSpace();

    // 레이저
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#38bdf8';
    ctx.fillStyle = '#7dd3fc';
    this.lasers.forEach(l => ctx.fillRect(l.x, l.y, l.w, l.h));
    ctx.restore();

    // 폭탄
    this.bombs.forEach(b => {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // 외계인 (모두 같은 색!)
    this.aliens.forEach(a => {
      if (!a.alive) return;
      const bob = Math.sin(this._frame / 10 + a.wob) * 3;
      ctx.fillStyle = '#7c3aed';
      this.rrect(a.x, a.y + bob, a.w, a.h, 12);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      this.rrect(a.x + 4, a.y + bob + 4, a.w - 8, 14, 8);
      ctx.fill();
      this.emoji('👾', a.x + a.w / 2, a.y + bob + 17, 18);
      ctx.fillStyle = '#ffffff';
      this.rrect(a.x + 4, a.y + bob + a.h - 23, a.w - 8, 21, 6);
      ctx.fill();
      this.text(a.code, a.x + a.w / 2, a.y + bob + a.h - 12, { size: 17, color: '#1e1b4b', weight: 900, font: '"Outfit", "Noto Sans KR", sans-serif' });
    });

    this._drawShip();

    if (this.waveClearing) {
      this.text('웨이브 클리어!', this.canvasW / 2, 250, { size: 30, color: '#34d399', weight: 900, font: '"Jua", "Noto Sans KR", sans-serif', stroke: 'rgba(0,0,0,0.6)' });
    }
  }
}
