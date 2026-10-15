/**
 * 문제 자동 생성기
 * KDC 데이터와 도서관 도서 목록을 바탕으로 매번 다른 문제를 만들어
 * 아이들이 다시 도전할 때마다 새로운 재미를 느끼게 합니다.
 *
 * 사서 선생님이 등록한(또는 기본) 문제는 그대로 쓰고,
 * 부족한 개수만 자동 생성 문제로 채웁니다.
 */

import { KDC_MAIN_CLASSES } from './kdcData.js';
import { LEE_AUTHOR_RULES } from './leeAuthorData.js';

/* ------------------------------------------------------------------ */
/* 공통 유틸                                                            */
/* ------------------------------------------------------------------ */

export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 모든 KDC 세부 분류(요목)를 한 줄로 펼친 목록 */
export const ALL_DIVISIONS = KDC_MAIN_CLASSES.flatMap(cls =>
  cls.divisions.map(div => ({
    code: div.code,
    name: div.name.split('/')[0].trim(),
    fullName: div.name,
    classCode: cls.code,
    className: cls.name,
    classIcon: cls.icon,
    color: cls.color
  }))
);

export function getMainClass(code) {
  const prefix = String(code).trim().charAt(0) + '00';
  return KDC_MAIN_CLASSES.find(c => c.code === prefix) || KDC_MAIN_CLASSES[0];
}

export function getDivision(code) {
  const three = String(code).trim().substring(0, 3);
  return ALL_DIVISIONS.find(d => d.code === three) || null;
}

/** 분류번호 숫자 비교 (813.6 < 813.62 < 813.7) */
export function compareClassNo(a, b) {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (Number.isNaN(na) || Number.isNaN(nb)) return String(a).localeCompare(String(b));
  return na - nb;
}

/** 청구기호 전체 비교: 분류번호 → 저자기호(가나다) → 권차 */
export function compareCallNumber(a, b) {
  // 도서 객체(classNo)와 게임 아이템(code) 모두 지원
  const c = compareClassNo(a.code ?? a.classNo, b.code ?? b.classNo);
  if (c !== 0) return c;
  const an = (a.authorNo || a.author || '').replace(/\s*v\.\d+/, '');
  const bn = (b.authorNo || b.author || '').replace(/\s*v\.\d+/, '');
  const ac = an.localeCompare(bn, 'ko');
  if (ac !== 0) return ac;
  const av = parseInt((a.volume || '').replace(/\D/g, ''), 10) || 0;
  const bv = parseInt((b.volume || '').replace(/\D/g, ''), 10) || 0;
  return av - bv;
}

function describeCode(div) {
  return `${div.code}은(는) ${div.className}(${div.classCode}번대)의 '${div.name}' 책이에요.`;
}

/** 서로 다른 대분류에서 하나씩 뽑기 */
function pickDivisionsFromDifferentClasses(count, excludeClassCodes = []) {
  const classes = shuffle(KDC_MAIN_CLASSES.filter(c => !excludeClassCodes.includes(c.code)));
  const result = [];
  for (const cls of classes) {
    if (result.length >= count) break;
    const divs = ALL_DIVISIONS.filter(d => d.classCode === cls.code);
    result.push(pickRandom(divs));
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* 게임별 생성기                                                         */
/* ------------------------------------------------------------------ */

function genMaze(books, difficulty) {
  const pool = books.filter(b => b.clue && b.classNo);
  if (pool.length === 0) return null;
  const book = pickRandom(pool);
  const target = getDivision(book.classNo) || {
    code: book.classNo.substring(0, 3),
    name: book.className || '주제',
    classCode: getMainClass(book.classNo).code,
    className: getMainClass(book.classNo).name
  };
  const distractors = pickDivisionsFromDifferentClasses(3, [target.classCode]);
  const useDecimal = difficulty === 'challenge' && book.classNo.includes('.');
  const targetCode = useDecimal ? book.classNo : target.code;

  const options = shuffle([
    {
      code: targetCode,
      label: `${targetCode} ${target.name}`,
      isCorrect: true,
      hint: `『${book.title}』은(는) ${target.className} 중 ${target.name}이라서 ${targetCode}번 서가에 있어요!`
    },
    ...distractors.map(d => ({
      code: d.code,
      label: `${d.code} ${d.name}`,
      isCorrect: false,
      hint: describeCode(d)
    }))
  ]);

  return {
    id: `gen-maze-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    clueTitle: `『${book.title}』을(를) 찾아라!`,
    clue: `${book.clue} 이 책은 어떤 번호 서가에 있을까요?`,
    targetClass: targetCode,
    targetSubject: `${target.name} (${target.className} ${target.classCode})`,
    correctBookId: book.id,
    options,
    generated: true
  };
}

function genShelfSort(books, difficulty) {
  const count = difficulty === 'challenge' ? 5 : 4;
  let chosen;

  if (difficulty === 'challenge') {
    // 같은 분류번호가 섞이도록: 분류번호 앞 세 자리가 같은 책 2권 + 나머지
    const groups = {};
    books.forEach(b => {
      const k = String(b.classNo).substring(0, 3);
      (groups[k] = groups[k] || []).push(b);
    });
    const pair = shuffle(Object.values(groups).filter(g => g.length >= 2))[0];
    const rest = shuffle(books.filter(b => !pair || !pair.includes(b)));
    chosen = pair ? [...shuffle(pair).slice(0, 2), ...rest.slice(0, count - 2)] : rest.slice(0, count);
  } else {
    // 서로 다른 정수 분류번호 책들만
    const seen = new Set();
    chosen = shuffle(books).filter(b => {
      const k = String(parseInt(b.classNo, 10));
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, count);
  }

  if (chosen.length < 3) return null;

  const sorted = [...chosen].sort(compareCallNumber);
  const items = sorted.map((b, idx) => ({
    id: `item-${idx + 1}`,
    code: b.classNo,
    title: b.title,
    authorNo: b.authorNo,
    volume: b.volume || '',
    rank: idx + 1
  }));

  const hasSameClass = new Set(items.map(i => i.code)).size < items.length;
  const hasDecimal = items.some(i => String(i.code).includes('.'));

  let explanation = '분류번호가 작은 책부터 왼쪽에 꽂아요.';
  if (hasDecimal) explanation += ' 소수점 뒤 숫자는 한 자리씩 비교해요(813.6 < 813.62 < 813.7).';
  if (hasSameClass) explanation += ' 번호가 같으면 저자기호 가나다순, 그다음 1권·2권 순서예요.';

  return {
    id: `gen-sort-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: hasSameClass ? '같은 번호는 가나다순!' : '작은 번호부터 차례로!',
    instructions: '책을 끌어서(또는 두 권을 차례로 눌러서) 왼쪽부터 올바른 순서로 정리해요.',
    items,
    explanation,
    generated: true
  };
}

function genSpaceDefense(books, difficulty) {
  const optionCount = difficulty === 'challenge' ? 6 : 4;
  const target = pickRandom(ALL_DIVISIONS);
  const distractors = pickDivisionsFromDifferentClasses(optionCount - 1, [target.classCode]);
  const options = shuffle([target, ...distractors]).map(d => d.code);

  const openers = ['외계인 출현!', '긴급 출동!', '서가를 지켜라!', '레이저 준비!', '우주 사령부 명령!'];
  return {
    id: `gen-space-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    clue: `${pickRandom(openers)} [${target.fullName}] 책 번호를 단 외계인을 찾아 쏘세요!`,
    targetClass: target.code,
    targetName: target.name,
    options,
    explanation: `${target.name}은(는) ${target.className} ${target.classCode}번대에 있어서 ${target.code}이에요!`,
    generated: true
  };
}

function genBrickBreaker(books, difficulty) {
  const classes = shuffle(KDC_MAIN_CLASSES);
  if (difficulty === 'challenge') {
    const [a, b] = classes;
    return {
      id: `gen-brick-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      missionText: `미션: [${a.code} ${a.name}]과 [${b.code} ${b.name}] 벽돌을 모두 깨뜨려라!`,
      targetCategory: `${a.code}_${b.code}`,
      targetLabel: `${a.code} ${a.name} & ${b.code} ${b.name}`,
      explanation: `${a.code}번대는 ${a.summary}, ${b.code}번대는 ${b.summary} 책이에요.`,
      generated: true
    };
  }
  const a = classes[0];
  return {
    id: `gen-brick-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    missionText: `미션: [${a.code} ${a.name}] 벽돌을 모두 깨뜨려라! (${a.code}~${a.code.charAt(0)}99)`,
    targetCategory: a.code,
    targetLabel: `${a.code} ${a.name}`,
    explanation: `${a.code}번대 ${a.name}에는 ${a.summary} 책이 모여 있어요.`,
    generated: true
  };
}

function genSnake(books, difficulty) {
  const count = difficulty === 'challenge' ? 5 : 4;
  let picks;
  if (difficulty === 'challenge') {
    // 소수점 번호가 섞인 도전 코스
    const decimalBooks = shuffle(books.filter(b => String(b.classNo).includes('.'))).slice(0, 2);
    const divs = pickDivisionsFromDifferentClasses(count - decimalBooks.length);
    picks = [
      ...decimalBooks.map(b => ({ code: b.classNo, label: `${b.classNo} ${(getDivision(b.classNo) || {}).name || b.className}` })),
      ...divs.map(d => ({ code: d.code, label: `${d.code} ${d.name}` }))
    ];
  } else {
    picks = pickDivisionsFromDifferentClasses(count).map(d => ({ code: d.code, label: `${d.code} ${d.name}` }));
  }
  // 중복 코드 제거
  const seen = new Set();
  picks = picks.filter(p => (seen.has(p.code) ? false : (seen.add(p.code), true)));
  picks.sort((a, b) => compareClassNo(a.code, b.code));
  const sequence = picks.map((p, idx) => ({ ...p, order: idx + 1 }));

  return {
    id: `gen-snake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: '작은 번호부터 차례대로!',
    sequence,
    explanation: `서가 순서는 ${sequence.map(s => s.code).join(' → ')} 처럼 작은 번호부터 커져요!`,
    generated: true
  };
}

/** 한글 음절의 첫소리(초성)를 호환 자모로 */
const CHOSEONG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
function initialConsonant(ch) {
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  return CHOSEONG[Math.floor(code / 588)];
}

/** 저자기호 분해: 성 / 숫자 / 제목 첫소리 */
function parseAuthorCode(code) {
  const m = String(code).trim().match(/^([가-힣A-Za-z])(\d{2,3})([ㄱ-ㅎ가-힣A-Za-z]?)/);
  if (!m) return null;
  return { surname: m[1], digits: m[2], tail: m[3] || '' };
}

function authorSamples(books) {
  const seen = new Set();
  return [
    ...LEE_AUTHOR_RULES.sampleAuthors.map(s => ({ name: s.name, title: s.title, code: s.code, classNo: s.classNo })),
    ...books.filter(b => b.authorNo).map(b => ({ name: b.author, title: b.title, code: b.authorNo, classNo: b.classNo }))
  ].filter(s => {
    const key = String(s.code).trim();
    const parsed = parseAuthorCode(key);
    if (!key || !parsed || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 성이 서로 다른 샘플 n개 고르기 */
function pickDistinctSurnames(samples, n) {
  const used = new Set();
  const out = [];
  for (const s of shuffle(samples)) {
    const p = parseAuthorCode(s.code);
    if (!p || used.has(p.surname)) continue;
    used.add(p.surname);
    out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

const AUTHOR_RULE_TEXT = '저자기호 = 글쓴이 성 + 이름 번호 + 책 제목 첫 글자의 첫소리. 번호가 같은 책꽂이에서는 저자기호 가나다순으로 꽂혀요.';

/**
 * 두더지 게임 - 저자기호 문제
 * 아이들이 저자기호를 '만들' 필요는 없어요. 읽고 구성을 알아보고, 꽂히는 순서를 아는 것이 목표!
 */
function genAuthorMole(books, difficulty) {
  const samples = authorSamples(books);
  if (samples.length < 4) return null;
  const types = difficulty === 'challenge'
    ? ['shelfFirst', 'shelfNext', 'shelfNext', 'part', 'titleInitial']
    : ['surname', 'surname', 'part', 'titleInitial', 'shelfFirst'];
  const type = pickRandom(types);
  const id = `gen-mole-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  if (type === 'surname') {
    const picks = pickDistinctSurnames(samples, 4);
    if (picks.length < 4) return null;
    const target = picks[0];
    const p = parseAuthorCode(target.code);
    return {
      id, generated: true,
      prompt: `글쓴이 성이 '${p.surname}'인 책! 저자기호 맨 앞 글자가 '${p.surname}'인 두더지를 잡아요.`,
      targetCode: target.code,
      moles: shuffle(picks.map((s, i) => ({ code: s.code, isTarget: i === 0, desc: `${s.name}의 『${s.title}』${i === 0 ? ' (정답!)' : ''}` }))),
      explanation: `저자기호 맨 앞 글자는 글쓴이의 성이에요. ${target.code} = '${p.surname}'씨(${target.name}) + 이름 번호 ${p.digits} + 제목 첫소리 '${p.tail}'`
    };
  }

  if (type === 'titleInitial') {
    const cands = samples.filter(s => {
      const p = parseAuthorCode(s.code);
      return p && p.tail && initialConsonant(s.title.trim().charAt(0)) === p.tail;
    });
    if (!cands.length) return genAuthorMole(books, 'basic');
    const target = pickRandom(cands);
    const tp = parseAuthorCode(target.code);
    const others = shuffle(samples.filter(s => s.code !== target.code && (parseAuthorCode(s.code) || {}).tail !== tp.tail)).slice(0, 3);
    if (others.length < 3) return genAuthorMole(books, 'basic');
    return {
      id, generated: true,
      prompt: `『${target.title}』처럼 제목이 '${tp.tail}' 소리로 시작하는 책! 저자기호 맨 뒤 글자가 '${tp.tail}'인 두더지를 잡아요.`,
      targetCode: target.code,
      moles: shuffle([
        { code: target.code, isTarget: true, desc: `${target.name}의 『${target.title}』 (정답!)` },
        ...others.map(o => ({ code: o.code, isTarget: false, desc: `${o.name}의 『${o.title}』` }))
      ]),
      explanation: `저자기호 맨 뒤 글자는 책 제목 첫 글자의 첫소리예요. 『${target.title}』 → '${target.title.trim().charAt(0)}' → '${tp.tail}' → ${target.code}`
    };
  }

  if (type === 'part') {
    const target = pickRandom(samples);
    const p = parseAuthorCode(target.code);
    const ask = pickRandom(p.tail ? ['surname', 'digits', 'tail'] : ['surname', 'digits']);
    const labels = { surname: '글쓴이의 성은', digits: '글쓴이 이름 번호는', tail: '책 제목 첫 글자의 첫소리는' };
    const parts = [
      { code: p.surname, key: 'surname', desc: '글쓴이의 성' },
      { code: p.digits, key: 'digits', desc: '이름 번호' }
    ];
    if (p.tail) parts.push({ code: p.tail, key: 'tail', desc: '제목 첫소리' });
    parts.push({ code: String(target.classNo || '813'), key: 'classNo', desc: '분류번호(주제 번호)' });
    return {
      id, generated: true,
      prompt: `저자기호 '${target.code}'(${target.name}의 『${target.title}』)에서 ${labels[ask]} 어느 것? 그 조각을 든 두더지를 잡아요!`,
      targetCode: parts.find(x => x.key === ask).code,
      moles: shuffle(parts.map(x => ({ code: x.code, isTarget: x.key === ask, desc: x.desc + (x.key === ask ? ' (정답!)' : '') }))),
      explanation: `${target.code} = 성 '${p.surname}' + 이름 번호 '${p.digits}'${p.tail ? ` + 제목 첫소리 '${p.tail}'` : ''}. 분류번호(${target.classNo || ''})는 저자기호가 아니라 그 위에 적는 주제 번호예요.`
    };
  }

  if (type === 'shelfFirst') {
    const picks = pickDistinctSurnames(samples, 4);
    if (picks.length < 4) return null;
    const sorted = [...picks].sort((a, b) => a.code.localeCompare(b.code, 'ko'));
    const target = sorted[0];
    return {
      id, generated: true,
      prompt: `번호가 같은 책꽂이에 이 네 권이 함께 꽂혀요. 가장 왼쪽(맨 앞)에 꽂히는 저자기호를 잡아요!`,
      targetCode: target.code,
      moles: shuffle(picks.map(s => ({ code: s.code, isTarget: s === target, desc: `${s.name}의 『${s.title}』${s === target ? ' (정답!)' : ''}` }))),
      explanation: `번호가 같으면 저자기호 가나다순! ${sorted.map(s => s.code).join(' → ')} 순서로 꽂혀요.`
    };
  }

  // shelfNext
  const picks = pickDistinctSurnames(samples, 4);
  if (picks.length < 4) return null;
  const sorted = [...picks].sort((a, b) => a.code.localeCompare(b.code, 'ko'));
  const k = Math.floor(Math.random() * 3); // 0..2
  const given = sorted[k];
  const target = sorted[k + 1];
  const moles = sorted.filter(s => s !== given);
  return {
    id, generated: true,
    prompt: `같은 번호 책꽂이에서 '${given.code}' 바로 다음(오른쪽)에 꽂히는 저자기호를 잡아요!`,
    targetCode: target.code,
    moles: shuffle(moles.map(s => ({ code: s.code, isTarget: s === target, desc: `${s.name}의 『${s.title}』${s === target ? ' (정답!)' : ''}` }))),
    explanation: `가나다순으로 ${sorted.map(s => s.code).join(' → ')}. 그래서 '${given.code}' 다음은 ${target.code}! ${AUTHOR_RULE_TEXT}`
  };
}

function genWhackMole(books, difficulty) {
  if (Math.random() < 0.55) {
    const q = genAuthorMole(books, difficulty);
    if (q) return q;
  }

  const target = pickRandom(ALL_DIVISIONS);
  const distractors = pickDivisionsFromDifferentClasses(3, [target.classCode]);
  return {
    id: `gen-mole-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    prompt: `[${target.fullName}] 책의 분류번호를 든 두더지를 잡아요!`,
    targetCode: target.code,
    moles: shuffle([
      { code: target.code, isTarget: true, desc: `${target.code} ${target.name} (정답!)` },
      ...distractors.map(d => ({ code: d.code, isTarget: false, desc: `${d.code} ${d.name}` }))
    ]),
    explanation: `${target.name}은(는) ${target.className} ${target.classCode}번대 → ${target.code}!`,
    generated: true
  };
}

const GENERATORS = {
  maze: genMaze,
  shelfSort: genShelfSort,
  spaceDefense: genSpaceDefense,
  brickBreaker: genBrickBreaker,
  snake: genSnake,
  whackMole: genWhackMole
};

/** 한 판에 나오는 문제 수 */
export const ROUND_SIZE = {
  maze: 3,
  shelfSort: 3,
  spaceDefense: 5,
  brickBreaker: 3,
  snake: 3,
  whackMole: 5
};

/**
 * 한 판(라운드) 문제 묶음 만들기
 * - 등록된 문제를 섞어서 일부 사용 (최대 60%)
 * - 나머지는 자동 생성으로 채워 매번 다른 판이 되도록
 */
export function buildRound(gameId, difficulty, staticQuestions = [], books = []) {
  const size = ROUND_SIZE[gameId] || 3;
  const generator = GENERATORS[gameId];

  const staticPool = shuffle(staticQuestions);
  const staticTake = Math.min(staticPool.length, Math.max(1, Math.ceil(size * 0.6)));
  const round = staticPool.slice(0, staticTake);

  const usedTargets = new Set(round.map(q => q.targetClass || q.targetCode || q.targetCategory || q.id));
  let guard = 0;
  while (round.length < size && generator && guard < 30) {
    guard++;
    const q = generator(books, difficulty);
    if (!q) continue;
    const key = q.targetClass || q.targetCode || q.targetCategory || q.id;
    if (usedTargets.has(key)) continue;
    usedTargets.add(key);
    round.push(q);
  }

  // 자동 생성이 불가능한 경우(도서 없음 등) 등록 문제로 채움
  if (round.length < size && staticPool.length > 0) {
    let i = 0;
    while (round.length < size) {
      round.push(staticPool[i % staticPool.length]);
      i++;
    }
  }

  return shuffle(round);
}
