/**
 * 게임 1: 미로 탈출 (Maze Explorer)
 * 서가 미로를 탐험하며 힌트에 맞는 분류번호 책을 찾아 출구로!
 *  - 별 조각(점)을 먹으며 점수 모으기 (팩맨 느낌)
 *  - 먼지 도깨비에 닿으면 하트 하나 잃고 출발점으로
 *  - 20초가 지나도 못 찾으면(쉬움 모드) 정답 책이 살짝 반짝임
 */

import { BaseGame } from './baseGame.js';
import { soundFx } from '../audio/soundFx.js';

const TEMPLATES = [
  [
    '1111111111111111111',
    '1000001000001000001',
    '1011101011101011101',
    '1000000000000000001',
    '1010111101011110101',
    '1010000001000000101',
    '1011101100011011101',
    '1000101000001010001',
    '1110101111111010111',
    '1000000001000000001',
    '1011111011101111101',
    '1000000000000000021',
    '1111111111111111111'
  ],
  [
    '1111111111111111111',
    '1000000001000000001',
    '1011111101011111101',
    '1010000000000000101',
    '1010111011101110101',
    '1000100000000010001',
    '1110101111111010111',
    '1000100000000010001',
    '1010111011101110101',
    '1010000000000000101',
    '1011111101011111101',
    '1000000001000000021',
    '1111111111111111111'
  ],
  [
    '1111111111111111111',
    '1000001000000100001',
    '1011101011110101101',
    '1000000010000000001',
    '1111011110111101111',
    '1000000000000000001',
    '1011011101011101101',
    '1000010001000100001',
    '1011110111011110101',
    '1000000000000000001',
    '1011101110111011101',
    '1000001000000100021',
    '1111111111111111111'
  ]
];

const SHELF_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];

export class MazeGame extends BaseGame {
  constructor(canvas, config) {
    super(canvas, config);
    this.timeLimit = this.difficulty === 'challenge' ? 75 : 90;
    this.startLives = 3;

    this.cols = 19;
    this.rows = 13;
    this.cellW = this.canvasW / this.cols;
    this.cellH = this.canvasH / this.rows;

    this.player = { x: 0, y: 0, dirX: 0, dirY: 0, speed: this.difficulty === 'challenge' ? 3.6 : 3.2 };
    this.inputDir = { x: 0, y: 0 };
    this.grid = [];
    this.dots = new Set();
    this.bookItems = [];
    this.enemies = [];
    this.powerStars = [];
    this.powerTimer = 0; // > 0 이면 유령을 잡을 수 있는 상태
    this.exit = { x: 17, y: 11, open: false };
    this.targetFound = false;
    this.invincible = 0;
    this.hintTimer = 0;
    this.templateOrder = [];

    this._onKey = this._onKey.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this.touchStart = null;
  }

  setup() {
    window.addEventListener('keydown', this._onKey);
    // 휴대폰: 화면을 밀거나(스와이프) 캐릭터 기준으로 가고 싶은 쪽을 탭
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: true });
    const idx = TEMPLATES.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    this.templateOrder = idx;
  }

  teardown() {
    window.removeEventListener('keydown', this._onKey);
    this.canvas.style.touchAction = '';
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
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

    if (Math.abs(dx) >= 18 || Math.abs(dy) >= 18) {
      // 스와이프
      if (Math.abs(dx) > Math.abs(dy)) this.setDirection(dx > 0 ? 1 : -1, 0);
      else this.setDirection(0, dy > 0 ? 1 : -1);
      return;
    }
    // 탭: 캐릭터 기준으로 탭한 방향
    const p = this.pointFromEvent(e);
    const rx = p.x - this.player.x;
    const ry = p.y - this.player.y;
    if (Math.abs(rx) < 6 && Math.abs(ry) < 6) return;
    if (Math.abs(rx) > Math.abs(ry)) this.setDirection(rx > 0 ? 1 : -1, 0);
    else this.setDirection(0, ry > 0 ? 1 : -1);
  }

  renderPreview() {
    this._buildGrid(TEMPLATES[0]);
    this._renderMap();
  }

  /* ---------------- 문제 세팅 ---------------- */

  onQuestionLoad(q, index) {
    const tpl = TEMPLATES[this.templateOrder[index % this.templateOrder.length] ?? 0];
    this._buildGrid(tpl);

    this.player.x = 1.5 * this.cellW;
    this.player.y = 1.5 * this.cellH;
    this.player.dirX = 0;
    this.player.dirY = 0;
    this.inputDir = { x: 0, y: 0 };
    this.targetFound = false;
    this.exit.open = false;
    this.invincible = 0;
    this.hintTimer = 0;
    this.powerTimer = 0;

    const dist = this._bfs(1, 1);
    this._placeItems(q, dist);
    this._placePowerStars(dist);
    this._placeDots(dist);
    this._placeEnemies(dist, index);

    this.setClue({
      tag: `미션 ${index + 1} / ${this.questions.length} · 번호 책을 찾아 출구로!`,
      title: q.clueTitle,
      clue: q.clue
    });
  }

  _buildGrid(tpl) {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        const v = parseInt(tpl[r][c] || '1', 10);
        if (v === 2) this.exit = { x: c, y: r, open: false };
        row.push(v);
      }
      this.grid.push(row);
    }
  }

  _bfs(sx, sy) {
    const dist = Array.from({ length: this.rows }, () => Array(this.cols).fill(-1));
    const queue = [[sx, sy]];
    dist[sy][sx] = 0;
    while (queue.length) {
      const [x, y] = queue.shift();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) return;
        if (this.grid[ny][nx] === 1) return;
        if (dist[ny][nx] !== -1) return;
        dist[ny][nx] = dist[y][x] + 1;
        queue.push([nx, ny]);
      });
    }
    return dist;
  }

  _placeItems(q, dist) {
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== 0) continue;
        if (dist[r][c] >= 6 && !(c === this.exit.x && r === this.exit.y)) {
          candidates.push({ x: c, y: r, d: dist[r][c] });
        }
      }
    }
    candidates.sort(() => Math.random() - 0.5);

    const chosen = [];
    let minGap = 6;
    while (chosen.length < q.options.length && minGap >= 2) {
      for (const cand of candidates) {
        if (chosen.length >= q.options.length) break;
        const farEnough = chosen.every(p => Math.abs(p.x - cand.x) + Math.abs(p.y - cand.y) >= minGap);
        const notNearExit = Math.abs(cand.x - this.exit.x) + Math.abs(cand.y - this.exit.y) >= 2;
        if (farEnough && notNearExit && !chosen.includes(cand)) chosen.push(cand);
      }
      minGap--;
    }

    this.bookItems = q.options.map((opt, i) => {
      const pos = chosen[i] || candidates[i] || { x: 9, y: 5 };
      return {
        gridX: pos.x,
        gridY: pos.y,
        code: opt.code,
        label: opt.label,
        isCorrect: opt.isCorrect,
        hint: opt.hint,
        collected: false,
        wobble: Math.random() * Math.PI * 2
      };
    });
  }

  _placePowerStars(dist) {
    const near = (x, y, px, py) => Math.abs(x - px) + Math.abs(y - py);
    const cells = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== 0 || dist[r][c] < 5) continue;
        if (this.bookItems.some(b => near(c, r, b.gridX, b.gridY) < 2)) continue;
        if (near(c, r, this.exit.x, this.exit.y) < 2) continue;
        cells.push({ x: c, y: r });
      }
    }
    cells.sort(() => Math.random() - 0.5);
    this.powerStars = [];
    for (const cell of cells) {
      if (this.powerStars.length >= 2) break;
      if (this.powerStars.every(s => near(cell.x, cell.y, s.x, s.y) >= 8)) {
        this.powerStars.push({ x: cell.x, y: cell.y, taken: false });
      }
    }
  }

  _placeDots(dist) {
    this.dots = new Set();
    const itemCells = new Set(this.bookItems.map(b => `${b.gridX},${b.gridY}`));
    this.powerStars.forEach(s => itemCells.add(`${s.x},${s.y}`));
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== 0) continue;
        if (dist[r][c] <= 1) continue;
        if (itemCells.has(`${c},${r}`)) continue;
        if ((c + r) % 2 === 0) this.dots.add(`${c},${r}`);
      }
    }
  }

  _placeEnemies(dist, index) {
    const count = this.difficulty === 'challenge' ? 3 : 2;
    const speed = (this.difficulty === 'challenge' ? 1.7 : 1.3) + index * 0.1;
    const cells = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== 0 || dist[r][c] < 8) continue;
        // 책 아이템 근처(3칸 이내)에는 유령이 생기지 않음
        if (this.bookItems.some(b => Math.abs(b.gridX - c) + Math.abs(b.gridY - r) <= 3)) continue;
        cells.push({ x: c, y: r });
      }
    }
    cells.sort(() => Math.random() - 0.5);
    this.enemies = cells.slice(0, count).map(cell => ({
      x: (cell.x + 0.5) * this.cellW,
      y: (cell.y + 0.5) * this.cellH,
      home: { x: cell.x, y: cell.y },
      dirX: 1, dirY: 0, speed, timer: 0, stunned: 0
    }));
  }

  /** 유령이 피해야 하는 칸: 아직 안 먹은 책 아이템 바로 옆 */
  _isNearItem(gx, gy) {
    return this.bookItems.some(b => !b.collected && Math.abs(b.gridX - gx) + Math.abs(b.gridY - gy) <= 1);
  }

  /* ---------------- 입력 ---------------- */

  _onKey(e) {
    if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); this.setDirection(0, -1); }
    else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); this.setDirection(0, 1); }
    else if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); this.setDirection(-1, 0); }
    else if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); this.setDirection(1, 0); }
  }

  setDirection(dx, dy) {
    this.inputDir = { x: dx, y: dy };
  }

  _walkable(gx, gy) {
    if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) return false;
    const t = this.grid[gy][gx];
    if (t === 1) return false;
    if (t === 2 && !this.exit.open) return false;
    return true;
  }

  /* ---------------- 로직 ---------------- */

  update(dt) {
    const p = this.player;
    this.hintTimer += dt;
    if (this.invincible > 0) this.invincible--;

    const gx = Math.floor(p.x / this.cellW);
    const gy = Math.floor(p.y / this.cellH);
    const cx = (gx + 0.5) * this.cellW;
    const cy = (gy + 0.5) * this.cellH;

    // 칸 중앙 근처에서, 지금 가는 방향과 다른 방향이 입력되어 있으면 방향 전환
    // (같은 방향으로 계속 가는 중에는 중앙 정렬을 하지 않음 → 제자리 반복 버그 방지)
    const wantsTurn = (this.inputDir.x || this.inputDir.y) &&
      (this.inputDir.x !== p.dirX || this.inputDir.y !== p.dirY);
    if (wantsTurn && Math.abs(p.x - cx) < 4 && Math.abs(p.y - cy) < 4) {
      if (this._walkable(gx + this.inputDir.x, gy + this.inputDir.y)) {
        p.dirX = this.inputDir.x;
        p.dirY = this.inputDir.y;
        p.x = cx; p.y = cy;
      }
    }

    const nx = p.x + p.dirX * p.speed;
    const ny = p.y + p.dirY * p.speed;
    const tx = Math.floor((nx + p.dirX * 14) / this.cellW);
    const ty = Math.floor((ny + p.dirY * 14) / this.cellH);
    if (this._walkable(tx, ty)) {
      p.x = nx; p.y = ny;
      this.blockedFrames = 0;
    } else {
      p.x = cx; p.y = cy;
      p.dirX = 0; p.dirY = 0;
    }

    // 벽을 향해 계속 누르고 있으면 안내
    if (!p.dirX && !p.dirY && (this.inputDir.x || this.inputDir.y)) {
      this.blockedFrames = (this.blockedFrames || 0) + 1;
      if (this.blockedFrames === 45) {
        this.addFloat('벽이에요! 다른 방향으로 ↔', p.x, p.y - 30, '#fbbf24', 15);
      }
      if (this.blockedFrames > 120) this.blockedFrames = 0;
    }

    // 별 조각
    const key = `${Math.floor(p.x / this.cellW)},${Math.floor(p.y / this.cellH)}`;
    if (this.dots.has(key)) {
      this.dots.delete(key);
      this.score += 5;
      soundFx.play('dot');
      if (this.dots.size === 0) {
        this.score += 100;
        this.addFloat('별 조각 올클리어! +100', this.canvasW / 2, 60, '#fbbf24', 20);
        soundFx.play('star');
      }
      this.emitStats();
    }

    // 큰 별: 먹으면 잠시 유령을 잡을 수 있음
    if (this.powerTimer > 0) this.powerTimer--;
    for (const st of this.powerStars) {
      if (st.taken) continue;
      const sx = (st.x + 0.5) * this.cellW;
      const sy = (st.y + 0.5) * this.cellH;
      if (Math.hypot(p.x - sx, p.y - sy) < this.cellW * 0.55) {
        st.taken = true;
        this.powerTimer = 420;
        this.score += 30;
        soundFx.play('star');
        this.addFloat('유령을 잡을 수 있어요! 👻', p.x, p.y - 30, '#60a5fa', 18);
        this.burst(sx, sy, '#fde68a', 18);
        this.emitStats();
      }
    }

    // 책 아이템
    for (const item of this.bookItems) {
      if (item.collected) continue;
      const ix = (item.gridX + 0.5) * this.cellW;
      const iy = (item.gridY + 0.5) * this.cellH;
      if (Math.hypot(p.x - ix, p.y - iy) < this.cellW * 0.55) {
        item.collected = true;
        if (item.isCorrect) {
          this.targetFound = true;
          this.exit.open = true;
          this.registerCorrect(150 + this.timeLeft, { x: ix, y: iy }, `정답! ${item.code}`);
          this.addFloat('출구가 열렸어요! ➡', this.canvasW / 2, this.canvasH / 2, '#34d399', 24);
        } else {
          this.registerWrong(40, {
            question: this.currentQuestion.clue,
            selected: item.label,
            correct: this.currentQuestion.targetClass,
            hint: item.hint
          }, { x: ix, y: iy });
        }
      }
    }

    // 출구
    if (this.exit.open) {
      const ex = (this.exit.x + 0.5) * this.cellW;
      const ey = (this.exit.y + 0.5) * this.cellH;
      if (Math.hypot(p.x - ex, p.y - ey) < this.cellW * 0.6) {
        const correct = this.currentQuestion.options.find(o => o.isCorrect);
        this.stageClear({
          title: '탈출 성공!',
          explanation: correct ? correct.hint : this.currentQuestion.targetSubject,
          answer: `${this.currentQuestion.targetClass} ${this.currentQuestion.targetSubject || ''}`
        }, 100 + Math.floor(this.timeLeft));
        return;
      }
    }

    // 유령
    const scared = this.powerTimer > 0;
    for (const en of this.enemies) {
      en.timer++;
      if (en.stunned > 0) { en.stunned--; continue; }
      const egx = Math.floor(en.x / this.cellW);
      const egy = Math.floor(en.y / this.cellH);
      const ecx = (egx + 0.5) * this.cellW;
      const ecy = (egy + 0.5) * this.cellH;
      const speed = scared ? en.speed * 0.6 : en.speed;
      if (Math.abs(en.x - ecx) < speed && Math.abs(en.y - ecy) < speed) {
        en.x = ecx; en.y = ecy;
        const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
          .filter(d => this._walkableForEnemy(egx + d.x, egy + d.y));
        const notBack = dirs.filter(d => !(d.x === -en.dirX && d.y === -en.dirY));
        // 책 아이템 바로 옆 칸은 피하기 (정답을 막고 서 있지 않도록)
        const awayFromItems = notBack.filter(d => !this._isNearItem(egx + d.x, egy + d.y));
        const pool = awayFromItems.length ? awayFromItems : (notBack.length ? notBack : dirs);
        if (pool.length) {
          let chosen = pool[Math.floor(Math.random() * pool.length)];
          const distTo = (d) => Math.hypot((egx + d.x + 0.5) * this.cellW - p.x, (egy + d.y + 0.5) * this.cellH - p.y);
          if (scared && Math.random() < 0.7) {
            // 겁먹은 유령은 플레이어에게서 도망
            chosen = pool.reduce((best, d) => (distTo(d) > distTo(best) ? d : best), chosen);
          } else if (!scared && Math.random() < 0.35) {
            // 가끔 플레이어 쪽으로 쫓아오기
            chosen = pool.reduce((best, d) => (distTo(d) < distTo(best) ? d : best), chosen);
          }
          en.dirX = chosen.x; en.dirY = chosen.y;
        }
      }
      en.x += en.dirX * speed;
      en.y += en.dirY * speed;

      if (Math.hypot(p.x - en.x, p.y - en.y) < 22) {
        if (scared) {
          // 유령 잡기! 자기 자리로 돌려보냄
          this.score += 50;
          soundFx.play('coin');
          this.addFloat('유령 퇴치! +50', en.x, en.y - 24, '#60a5fa', 18);
          this.burst(en.x, en.y, '#93c5fd', 16);
          en.x = (en.home.x + 0.5) * this.cellW;
          en.y = (en.home.y + 0.5) * this.cellH;
          en.stunned = 90;
          this.emitStats();
          continue;
        }
        if (this.invincible > 0) continue;
        const ended = this.loseLife({ x: p.x, y: p.y });
        if (!ended) {
          this.invincible = 110;
          p.x = 1.5 * this.cellW; p.y = 1.5 * this.cellH;
          p.dirX = 0; p.dirY = 0;
          this.inputDir = { x: 0, y: 0 };
          this.addFloat('출발점으로!', p.x + 60, p.y, '#fb7185', 16);
        }
      }
    }
  }

  _walkableForEnemy(gx, gy) {
    if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) return false;
    return this.grid[gy][gx] === 0;
  }

  /* ---------------- 그리기 ---------------- */

  _renderMap() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.grid[r][c];
        const x = c * this.cellW, y = r * this.cellH;
        if (t === 1) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x, y, this.cellW, this.cellH);
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 2, y + 2, this.cellW - 4, this.cellH - 4);
          // 꽂힌 책들
          const seed = (c * 7 + r * 13) % SHELF_COLORS.length;
          for (let k = 0; k < 4; k++) {
            ctx.fillStyle = SHELF_COLORS[(seed + k) % SHELF_COLORS.length];
            const bw = 6;
            const bh = this.cellH - 14 - ((k * 3) % 6);
            ctx.fillRect(x + 5 + k * 9, y + this.cellH - 5 - bh, bw, bh);
          }
        } else if (t === 2) {
          ctx.fillStyle = this.exit.open ? '#10b981' : '#475569';
          ctx.fillRect(x, y, this.cellW, this.cellH);
          if (this.exit.open) {
            const pulse = 0.5 + 0.5 * Math.sin(this._frame / 6);
            ctx.fillStyle = `rgba(255,255,255,${0.25 + pulse * 0.3})`;
            ctx.fillRect(x + 4, y + 4, this.cellW - 8, this.cellH - 8);
          }
          this.text(this.exit.open ? '출구' : '🔒', x + this.cellW / 2, y + this.cellH / 2, { size: 13, color: '#fff' });
        } else {
          ctx.fillStyle = (c + r) % 2 === 0 ? '#0f172a' : '#111a2e';
          ctx.fillRect(x, y, this.cellW, this.cellH);
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    this._renderMap();

    // 별 조각
    ctx.fillStyle = '#fde68a';
    this.dots.forEach(key => {
      const [c, r] = key.split(',').map(Number);
      const x = (c + 0.5) * this.cellW;
      const y = (r + 0.5) * this.cellH;
      const tw = 2.5 + Math.sin((this._frame + c * 3 + r * 5) / 8) * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, tw, 0, Math.PI * 2);
      ctx.fill();
    });

    // 책 아이템
    const showHint = !this.targetFound && this.difficulty === 'basic' && this.hintTimer > 20000;
    this.bookItems.forEach(item => {
      if (item.collected) return;
      const ix = (item.gridX + 0.5) * this.cellW;
      const iy = (item.gridY + 0.5) * this.cellH + Math.sin(this._frame / 10 + item.wobble) * 2;

      if (showHint && item.isCorrect) {
        const pulse = 0.5 + 0.5 * Math.sin(this._frame / 5);
        ctx.beginPath();
        ctx.arc(ix, iy, 20 + pulse * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251,191,36,${0.4 + pulse * 0.5})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(ix, iy, 17, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99,102,241,0.35)';
      ctx.fill();
      this.emoji('📘', ix, iy + 1, 18);

      // 번호 배지
      ctx.fillStyle = '#ffffff';
      this.rrect(ix - 27, iy - 36, 54, 21, 7);
      ctx.fill();
      this.text(item.code, ix, iy - 25, { size: 15, color: '#0f172a', weight: 900, font: '"Outfit", "Noto Sans KR", sans-serif' });
    });

    // 출구 방향 화살표
    if (this.exit.open) {
      const ex = (this.exit.x + 0.5) * this.cellW;
      const ey = (this.exit.y + 0.5) * this.cellH;
      const ang = Math.atan2(ey - this.player.y, ex - this.player.x);
      const ax = this.player.x + Math.cos(ang) * 34;
      const ay = this.player.y + Math.sin(ang) * 34;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 큰 별
    this.powerStars.forEach(st => {
      if (st.taken) return;
      const sx = (st.x + 0.5) * this.cellW;
      const sy = (st.y + 0.5) * this.cellH;
      const pulse = 0.5 + 0.5 * Math.sin(this._frame / 7);
      ctx.beginPath();
      ctx.arc(sx, sy, 14 + pulse * 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(253,224,71,${0.15 + pulse * 0.2})`;
      ctx.fill();
      this.emoji('⭐', sx, sy + 1, 20 + pulse * 3);
    });

    // 유령 (별을 먹으면 겁먹은 모습)
    const scared = this.powerTimer > 0;
    const ending = scared && this.powerTimer < 100 && Math.floor(this._frame / 6) % 2 === 0;
    this.enemies.forEach(en => {
      const bob = Math.sin(this._frame / 6) * 2;
      ctx.beginPath();
      ctx.arc(en.x, en.y + bob, 15, 0, Math.PI * 2);
      ctx.fillStyle = scared ? (ending ? 'rgba(248,250,252,0.35)' : 'rgba(96,165,250,0.45)') : 'rgba(148,163,184,0.25)';
      ctx.fill();
      this.emoji(en.stunned > 0 ? '💫' : (scared ? '😱' : '👻'), en.x, en.y + bob, 22);
    });

    if (scared) {
      const w = Math.max(0, (this.powerTimer / 420)) * 160;
      ctx.fillStyle = 'rgba(15,23,42,0.75)';
      this.rrect(this.canvasW / 2 - 84, 6, 168, 16, 8);
      ctx.fill();
      ctx.fillStyle = '#60a5fa';
      this.rrect(this.canvasW / 2 - 80, 9, w, 10, 5);
      ctx.fill();
    }

    // 플레이어
    const p = this.player;
    const blink = this.invincible > 0 && Math.floor(this._frame / 4) % 2 === 0;
    if (!blink) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = this.targetFound ? '#34d399' : '#ec4899';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      this.emoji(this.avatar, p.x, p.y + 1, 18);
    }
  }
}
