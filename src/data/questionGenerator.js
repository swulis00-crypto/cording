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

/** 저자기호를 살짝 바꿔 헷갈리는 오답 만들기 */
function mutateAuthorCode(code) {
  const m = String(code).match(/^([가-힣A-Za-z])(\d{2,3})(.*)$/);
  if (!m) return null;
  const [, surname, digits, tail] = m;
  const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전'];
  const consonants = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  const otherSurname = pickRandom(surnames.filter(s => s !== surname));
  const swappedDigits = digits.length >= 2 ? digits.charAt(1) + digits.charAt(0) + digits.slice(2) : digits;
  const otherDigits = swappedDigits === digits ? String((parseInt(digits, 10) + 11) % 100).padStart(2, '0') : swappedDigits;
  const tailChar = tail.trim().charAt(0);
  const otherTail = tail ? pickRandom(consonants.filter(c => c !== tailChar)) + tail.slice(1) : 'ㅅ';

  return {
    wrongSurname: { code: `${otherSurname}${digits}${tail}`, desc: '성(姓)이 달라요' },
    wrongDigits: { code: `${surname}${otherDigits}${tail}`, desc: '숫자가 달라요' },
    wrongTail: { code: `${surname}${digits}${otherTail}`, desc: '책 제목 첫 글자가 달라요' }
  };
}

function genWhackMole(books, difficulty) {
  const useAuthor = Math.random() < 0.5;

  if (useAuthor) {
    const seenCodes = new Set();
    const samples = [
      ...LEE_AUTHOR_RULES.sampleAuthors.map(s => ({ name: s.name, title: s.title, code: s.code })),
      ...books.filter(b => b.authorNo).map(b => ({ name: b.author, title: b.title, code: b.authorNo }))
    ].filter(s => {
      const key = String(s.code).trim();
      if (!key || seenCodes.has(key)) return false;
      seenCodes.add(key);
      return true;
    });
    if (samples.length < 4) return null;
    const target = pickRandom(samples);
    const mutated = mutateAuthorCode(target.code);
    if (!mutated) return null;

    const firstChar = target.title.trim().charAt(0);
    let moles;
    if (difficulty === 'challenge') {
      moles = [
        { code: target.code, isTarget: true, desc: `${target.name}의 『${target.title}』 (정답!)` },
        { code: mutated.wrongSurname.code, isTarget: false, desc: mutated.wrongSurname.desc },
        { code: mutated.wrongDigits.code, isTarget: false, desc: mutated.wrongDigits.desc },
        { code: mutated.wrongTail.code, isTarget: false, desc: mutated.wrongTail.desc }
      ];
    } else {
      const others = shuffle(samples.filter(s => s.code !== target.code)).slice(0, 3);
      moles = [
        { code: target.code, isTarget: true, desc: `${target.name}의 『${target.title}』 (정답!)` },
        ...others.map(o => ({ code: o.code, isTarget: false, desc: `${o.name}의 『${o.title}』` }))
      ];
    }
    const m = String(target.code).match(/^([가-힣A-Za-z])(\d{2,3})(.*)$/);
    return {
      id: `gen-mole-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      prompt: `${target.name}이(가) 쓴 『${target.title}』의 저자기호를 든 두더지를 잡아요!`,
      targetCode: target.code,
      moles: shuffle(moles),
      explanation: m
        ? `성 '${m[1]}' + 이름 번호 '${m[2]}' + 제목 첫 글자 '${firstChar}'의 첫소리 '${m[3]}' = ${target.code}`
        : `${target.name}의 『${target.title}』 저자기호는 ${target.code}이에요.`,
      generated: true
    };
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
