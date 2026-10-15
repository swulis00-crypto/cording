/**
 * 애플리케이션 상태 관리 모듈
 *
 * 개인정보 보호 원칙:
 *  - 이용자 이름, 별명, 점수 기록은 저장하지 않습니다.
 *  - 브라우저에 남는 것은 사서 선생님이 등록한 도서/문제 데이터와
 *    소리 설정(켜짐/꺼짐)만입니다.
 *  - 아바타, 이번 시간에 모은 별 등은 새로고침하면 사라지는 메모리 값입니다.
 */

import { INITIAL_BOOK_DATABASE } from '../data/bookDatabase.js';
import { GAME_QUESTIONS } from '../data/defaultQuestions.js';
import { buildRound } from '../data/questionGenerator.js';

const STORAGE_KEY_BOOKS = 'book_trail_custom_books';
const STORAGE_KEY_QUESTIONS = 'book_trail_custom_questions';
const STORAGE_KEY_SETTINGS = 'book_trail_settings';

// 예전 버전이 남긴 이용자/점수 데이터는 깨끗하게 지웁니다.
const LEGACY_KEYS = ['book_trail_user', 'book_trail_scores'];

export const AVATARS = ['🦊', '🐰', '🐻', '🐼', '🦉', '🐱', '🐸', '🦄'];

export const GAME_METADATA = {
  maze: {
    id: 'maze',
    title: '미로 탈출',
    subtitle: '힌트에 맞는 번호 책을 찾아 출구로!',
    icon: '🧭',
    themeColor: '#6366f1',
    howTo: '화살표·터치 패드로 움직이거나, 화면을 가고 싶은 쪽으로 밀어요(스와이프). 반짝이는 별도 모으고, 먼지 도깨비는 피해요!',
    skills: '주제 → 분류번호 찾기',
    controls: 'dpad'
  },
  shelfSort: {
    id: 'shelfSort',
    title: '책꽂이 정리',
    subtitle: '뒤섞인 책을 번호 순서대로 꽂아요!',
    icon: '📚',
    themeColor: '#3b82f6',
    howTo: '책을 끌어서(또는 두 권을 차례로 눌러서) 자리를 바꾼 뒤 "확인!"을 눌러요.',
    skills: '서가 배열 순서 (소수점, 가나다, 1권·2권)',
    controls: 'action'
  },
  spaceDefense: {
    id: 'spaceDefense',
    title: '외계인 격퇴',
    subtitle: '주제에 맞는 번호 외계인만 쏘기!',
    icon: '👾',
    themeColor: '#10b981',
    howTo: '좌우로 움직이고 스페이스바(또는 발사 버튼)로 레이저를 쏴요. 다른 외계인을 쏘면 하트가 줄어요!',
    skills: '주제별 분류번호 빨리 찾기',
    controls: 'horizontal-action'
  },
  brickBreaker: {
    id: 'brickBreaker',
    title: '벽돌 깨기',
    subtitle: '미션 번호대 벽돌을 공으로 깨뜨려요!',
    icon: '🧱',
    themeColor: '#f59e0b',
    howTo: '마우스·터치·좌우 키로 막대를 움직여요. 미션 번호대 벽돌은 한 번에, 다른 벽돌은 두 번 맞아야 깨져요.',
    skills: '분류번호 백 자리(000~900) 구별',
    controls: 'horizontal'
  },
  snake: {
    id: 'snake',
    title: '책벌레 뱀',
    subtitle: '작은 번호부터 차례대로 먹어요!',
    icon: '🐍',
    themeColor: '#14b8a6',
    howTo: '화살표로 뱀을 움직여 번호가 작은 책부터 순서대로 먹어요. 내 몸에 부딪히면 하트가 줄어요!',
    skills: '청구기호 오름차순 배열',
    controls: 'dpad'
  },
  whackMole: {
    id: 'whackMole',
    title: '두더지 팡팡',
    subtitle: '정답 기호를 든 두더지를 콩!',
    icon: '🔨',
    themeColor: '#ec4899',
    howTo: '두더지가 든 팻말을 잘 읽고, 정답 두더지를 빠르게 눌러요!',
    skills: '저자기호 읽기 & 분류번호 순발력',
    controls: 'pointer'
  }
};

class Store {
  constructor() {
    LEGACY_KEYS.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
    });

    this.books = this._loadBooks();
    this.questions = this._loadQuestions();
    this.settings = this._loadSettings();

    this.currentScreen = 'start';
    this.selectedGame = 'maze';
    this.difficulty = 'basic'; // 'basic' | 'challenge'

    // 세션 전용(저장하지 않음)
    this.session = {
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      stars: {},        // gameId -> 이번 시간 최고 별 개수
      plays: 0,
      totalStars: 0,
      bestCombo: 0,
      totalScore: 0
    };

    this.listeners = [];
  }

  /* ---------------- 저장소 로드 ---------------- */

  _loadBooks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BOOKS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(INITIAL_BOOK_DATABASE));
  }

  _loadQuestions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(GAME_QUESTIONS));
  }

  _loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) return { sound: true, bgm: false, ...JSON.parse(raw) };
    } catch (e) { /* ignore */ }
    return { sound: true, bgm: false };
  }

  _save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  /* ---------------- 구독 ---------------- */

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  /* ---------------- 화면 / 세션 ---------------- */

  setScreen(screen, gameId = null) {
    this.currentScreen = screen;
    if (gameId) this.selectedGame = gameId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify();
  }

  setDifficulty(diff) {
    this.difficulty = diff;
    this.notify();
  }

  setAvatar(emoji) {
    // 화면을 다시 그리지 않음(시작 화면이 직접 표시를 갱신)
    this.session.avatar = emoji;
  }

  recordResult(gameId, stars, score, combo = 0) {
    const prev = this.session.stars[gameId] || 0;
    if (stars > prev) {
      this.session.totalStars += stars - prev;
      this.session.stars[gameId] = stars;
    }
    this.session.plays += 1;
    this.session.totalScore += score || 0;
    this.session.bestCombo = Math.max(this.session.bestCombo, combo);
  }

  setSetting(key, value) {
    this.settings = { ...this.settings, [key]: value };
    this._save(STORAGE_KEY_SETTINGS, this.settings);
  }

  /* ---------------- 도서 관리 (사서용) ---------------- */

  addBook(book) {
    const newBook = { ...book, id: 'b-custom-' + Date.now() };
    this.books.unshift(newBook);
    this._save(STORAGE_KEY_BOOKS, this.books);
    return newBook;
  }

  updateBook(id, updated) {
    const idx = this.books.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.books[idx] = { ...this.books[idx], ...updated };
      this._save(STORAGE_KEY_BOOKS, this.books);
    }
  }

  deleteBook(id) {
    this.books = this.books.filter(b => b.id !== id);
    this._save(STORAGE_KEY_BOOKS, this.books);
  }

  resetBooksToDefault() {
    this.books = JSON.parse(JSON.stringify(INITIAL_BOOK_DATABASE));
    this._save(STORAGE_KEY_BOOKS, this.books);
  }

  /* ---------------- 문제 데이터 ---------------- */

  getQuestions(gameId, difficulty = this.difficulty) {
    const gameQ = this.questions[gameId];
    if (!gameQ) return [];
    return gameQ[difficulty] || gameQ.basic || [];
  }

  /** 한 판에 쓸 문제 묶음 (등록 문제 + 자동 생성 혼합) */
  getRound(gameId, difficulty = this.difficulty) {
    return buildRound(gameId, difficulty, this.getQuestions(gameId, difficulty), this.books);
  }

  updateQuestions(gameId, difficulty, list) {
    if (!this.questions[gameId]) this.questions[gameId] = {};
    this.questions[gameId][difficulty] = list;
    this._save(STORAGE_KEY_QUESTIONS, this.questions);
  }

  resetQuestionsToDefault() {
    this.questions = JSON.parse(JSON.stringify(GAME_QUESTIONS));
    this._save(STORAGE_KEY_QUESTIONS, this.questions);
  }

  /* ---------------- 백업 ---------------- */

  exportAllData() {
    return JSON.stringify({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      books: this.books,
      questions: this.questions
    }, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.books && Array.isArray(data.books)) {
        this.books = data.books;
        this._save(STORAGE_KEY_BOOKS, this.books);
      }
      if (data.questions && typeof data.questions === 'object') {
        this.questions = data.questions;
        this._save(STORAGE_KEY_QUESTIONS, this.questions);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const store = new Store();
