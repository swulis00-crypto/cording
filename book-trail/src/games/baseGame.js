/**
 * 모든 고전게임의 공통 베이스 클래스
 *
 * 제공 기능
 *  - 타이머 / 점수 / 콤보 / 목숨(하트) 관리
 *  - 정답·오답 등록 시 공통 연출(떠오르는 글자, 파티클, 화면 흔들림, 효과음)
 *  - 스테이지 클리어 → 설명 오버레이(onStageClear) → 다음 문제
 *  - 중복 종료 방지(finish 가드)
 *  - 마우스/터치 좌표를 캔버스 좌표로 변환
 *
 * 하위 클래스 구현 항목
 *  - timeLimit, startLives (선택)
 *  - setup()               : 리스너 등록, 보드 준비
 *  - onQuestionLoad(q, i)  : 문제 세팅
 *  - update(dt)            : 게임 로직 (일시정지 시 호출되지 않음)
 *  - render()              : 캔버스 그리기
 *  - teardown()            : 리스너 해제
 */

import { soundFx } from '../audio/soundFx.js';

export class BaseGame {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config || {};
    this.questions = this.config.questions || [];
    this.difficulty = this.config.difficulty || 'basic';
    this.avatar = this.config.avatar || '🧑';

    this.canvasW = 800;
    this.canvasH = 520;

    this.timeLimit = 60;
    this.startLives = 3; // null 이면 하트 숨김

    this.currentQIndex = 0;
    this.score = 0;
    this.correctCount = 0;
    this.wrongNotes = [];
    this.combo = 0;
    this.maxCombo = 0;

    this.isRunning = false;
    this.isPaused = false;
    this.finished = false;

    this.floatingTexts = [];
    this.particles = [];
    this.shake = 0;
    this.flashColor = null;
    this.flashAlpha = 0;

    this.timerId = null;
    this._raf = null;
    this._lastTs = 0;
    this._frame = 0;
  }

  /* ------------------------------------------------------------ */
  /* 수명 주기                                                      */
  /* ------------------------------------------------------------ */

  /** 카운트다운이 끝난 뒤 main 에서 호출 */
  start() {
    this.canvas.width = this.canvasW;
    this.canvas.height = this.canvasH;
    this.timeLeft = this.timeLimit;
    this.lives = this.startLives;

    this.setup();
    this.isRunning = true;
    this.loadQuestion(0);
    this.emitStats();

    this.timerId = setInterval(() => {
      if (!this.isRunning || this.isPaused) return;
      this.timeLeft--;
      this.emitStats();
      if (this.timeLeft <= 5 && this.timeLeft > 0) soundFx.play('countdown');
      if (this.timeLeft <= 0) this.finish('timeout');
    }, 1000);

    this._lastTs = performance.now();
    this._loop(this._lastTs);
  }

  /** 미리 보기용 정적 화면(카운트다운 중) */
  preview() {
    this.canvas.width = this.canvasW;
    this.canvas.height = this.canvasH;
    try {
      this.renderPreview();
    } catch (e) { /* ignore */ }
  }

  renderPreview() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);
  }

  loadQuestion(index) {
    if (index >= this.questions.length) {
      this.finish('complete');
      return;
    }
    this.currentQIndex = index;
    this.onQuestionLoad(this.questions[index], index);
  }

  get currentQuestion() {
    return this.questions[this.currentQIndex];
  }

  _loop(ts) {
    if (!this.isRunning) return;
    const dt = Math.min(50, ts - this._lastTs);
    this._lastTs = ts;
    this._frame++;

    if (!this.isPaused) {
      try { this.update(dt); } catch (e) { console.error(e); }
    }

    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      this.shake *= 0.85;
    } else {
      this.shake = 0;
    }
    try { this.render(); } catch (e) { console.error(e); }
    this._drawEffects();
    ctx.restore();

    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  finish(reason = 'complete') {
    if (this.finished) return;
    this.finished = true;
    this.isRunning = false;
    clearInterval(this.timerId);
    cancelAnimationFrame(this._raf);
    try { this.teardown(); } catch (e) { /* ignore */ }

    if (this.config.onComplete) {
      this.config.onComplete({
        score: this.score,
        correctCount: this.correctCount,
        totalQuestions: this.questions.length,
        wrongNotes: this.wrongNotes,
        maxCombo: this.maxCombo,
        timeLeft: Math.max(0, this.timeLeft),
        reason
      });
    }
  }

  destroy() {
    this.isRunning = false;
    this.finished = true;
    clearInterval(this.timerId);
    cancelAnimationFrame(this._raf);
    try { this.teardown(); } catch (e) { /* ignore */ }
  }

  pause() { this.isPaused = true; }
  resume() {
    this.isPaused = false;
    this._lastTs = performance.now();
  }

  /* ------------------------------------------------------------ */
  /* HUD 연동                                                       */
  /* ------------------------------------------------------------ */

  emitStats() {
    if (this.config.onStatsUpdate) {
      this.config.onStatsUpdate({
        score: this.score,
        time: this.timeLeft,
        lives: this.lives,
        combo: this.combo
      });
    }
  }

  setClue(info) {
    if (this.config.onClueUpdate) this.config.onClueUpdate(info);
  }

  /* ------------------------------------------------------------ */
  /* 정답 / 오답 / 스테이지                                           */
  /* ------------------------------------------------------------ */

  /**
   * 정답 처리: 점수 + 콤보 보너스 + 연출
   * @returns 실제 획득 점수
   */
  registerCorrect(points, pos = null, label = null) {
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const bonus = Math.min(this.combo - 1, 5) * 20;
    const total = points + bonus;
    this.score += total;

    const x = pos ? pos.x : this.canvasW / 2;
    const y = pos ? pos.y : this.canvasH / 2;
    this.addFloat(label || `+${total}`, x, y, '#34d399', 22);
    if (this.combo >= 2) {
      this.addFloat(`${this.combo} 콤보!`, x, y - 26, '#fbbf24', 16);
      soundFx.play('combo');
    } else {
      soundFx.play('correct');
    }
    this.burst(x, y, '#34d399', 16);
    this.emitStats();
    return total;
  }

  /**
   * 오답 처리: 감점 + 콤보 초기화 + 오답노트 + 힌트 토스트
   */
  registerWrong(penalty, note, pos = null) {
    this.combo = 0;
    this.score = Math.max(0, this.score - penalty);
    if (note) this.wrongNotes.push(note);

    const x = pos ? pos.x : this.canvasW / 2;
    const y = pos ? pos.y : this.canvasH / 2;
    if (penalty > 0) this.addFloat(`-${penalty}`, x, y, '#fb7185', 20);
    this.burst(x, y, '#fb7185', 10);
    this.shakeScreen(10);
    this.flash('#f43f5e');
    soundFx.play('wrong');

    if (this.config.onWrong && note) {
      this.config.onWrong({ hint: note.hint, correct: note.correct, selected: note.selected });
    }
    this.emitStats();
  }

  /**
   * 목숨 하나 잃기. 0 이 되면 종료.
   * @returns true 면 게임 종료됨
   */
  loseLife(pos = null) {
    if (this.lives === null) return false;
    this.lives = Math.max(0, this.lives - 1);
    this.combo = 0;
    const x = pos ? pos.x : this.canvasW / 2;
    const y = pos ? pos.y : this.canvasH / 2;
    this.addFloat('💔', x, y, '#fb7185', 26);
    this.shakeScreen(14);
    this.flash('#f43f5e');
    soundFx.play('hit');
    this.emitStats();
    if (this.lives <= 0) {
      setTimeout(() => this.finish('lives'), 400);
      return true;
    }
    return false;
  }

  /**
   * 스테이지(문제) 클리어 → 설명 오버레이 → 다음 문제
   * @param info { title, explanation, quick }
   *  quick: true 이면 게임을 멈추지 않고 짧은 배너만 띄움(빠른 템포 게임용)
   */
  stageClear(info = {}, bonusPoints = 0) {
    if (this.finished) return;
    this.correctCount++;
    if (bonusPoints > 0) {
      this.score += bonusPoints;
      this.addFloat(`스테이지 보너스 +${bonusPoints}`, this.canvasW / 2, this.canvasH / 2 - 40, '#fbbf24', 18);
    }
    this.emitStats();

    const isLast = this.currentQIndex + 1 >= this.questions.length;
    const next = () => {
      if (this.finished) return;
      this.resume();
      this.loadQuestion(this.currentQIndex + 1);
    };

    if (info.quick) {
      soundFx.play('coin');
      if (this.config.onStageClear) {
        this.config.onStageClear({ ...info, isLast, index: this.currentQIndex, total: this.questions.length }, () => {});
      }
      this.pause();
      setTimeout(next, 650);
      return;
    }

    soundFx.play('victory');
    this.pause();
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.burst(
        Math.random() * this.canvasW,
        Math.random() * this.canvasH * 0.6,
        ['#fbbf24', '#34d399', '#60a5fa', '#f472b6'][i],
        18
      ), i * 120);
    }
    if (this.config.onStageClear) {
      this.config.onStageClear({ ...info, isLast, index: this.currentQIndex, total: this.questions.length }, next);
    } else {
      setTimeout(next, 1500);
    }
  }

  /**
   * 문제를 못 풀고 넘어갈 때(정답 공개 후 다음 문제로)
   */
  stageSkip(info = {}) {
    if (this.finished) return;
    const isLast = this.currentQIndex + 1 >= this.questions.length;
    const next = () => {
      if (this.finished) return;
      this.resume();
      this.loadQuestion(this.currentQIndex + 1);
    };
    this.pause();
    if (this.config.onStageClear) {
      this.config.onStageClear({ ...info, fail: true, isLast, index: this.currentQIndex, total: this.questions.length }, next);
    } else {
      setTimeout(next, 1500);
    }
  }

  /* ------------------------------------------------------------ */
  /* 연출 효과                                                      */
  /* ------------------------------------------------------------ */

  addFloat(text, x, y, color = '#ffffff', size = 18) {
    this.floatingTexts.push({ text, x, y, color, size, alpha: 1, vy: -1.2, life: 0 });
  }

  burst(x, y, color = '#ffffff', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color,
        alpha: 1,
        size: Math.random() * 4 + 2
      });
    }
  }

  shakeScreen(intensity = 8) {
    this.shake = Math.max(this.shake, intensity);
  }

  flash(color) {
    this.flashColor = color;
    this.flashAlpha = 0.28;
  }

  _drawEffects() {
    const ctx = this.ctx;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.alpha -= 0.03;
      if (p.alpha <= 0) { this.particles.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life++;
      ft.y += ft.vy;
      if (ft.life > 25) ft.alpha -= 0.04;
      if (ft.alpha <= 0) { this.floatingTexts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `800 ${ft.size}px "Jua", "Noto Sans KR", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';

    if (this.flashAlpha > 0 && this.flashColor) {
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(-20, -20, this.canvasW + 40, this.canvasH + 40);
      ctx.globalAlpha = 1;
      this.flashAlpha -= 0.03;
    }
  }

  /* ------------------------------------------------------------ */
  /* 그리기 도우미                                                   */
  /* ------------------------------------------------------------ */

  /** 둥근 사각형 (roundRect 미지원 브라우저 대비) */
  rrect(x, y, w, h, r) {
    const ctx = this.ctx;
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  /** 가운데 정렬 글자(테두리 포함) */
  text(str, x, y, { size = 14, color = '#fff', weight = 700, font = '"Noto Sans KR", sans-serif', align = 'center', stroke = null, baseline = 'middle' } = {}) {
    const ctx = this.ctx;
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (stroke) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = stroke;
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.textBaseline = 'alphabetic';
  }

  emoji(str, x, y, size = 20) {
    const ctx = this.ctx;
    ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(str, x, y);
    ctx.textBaseline = 'alphabetic';
  }

  /** 마우스/터치 이벤트 → 캔버스 좌표 */
  pointFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const src = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    return {
      x: (src.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (src.clientY - rect.top) * (this.canvas.height / rect.height)
    };
  }

  /* 하위 클래스가 덮어쓰는 기본 구현 */
  setup() {}
  onQuestionLoad() {}
  update() {}
  render() {}
  teardown() {}
}
