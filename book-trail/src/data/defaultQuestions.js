/**
 * 6개 고전 게임별 맞춤형 문제 및 스테이지 데이터 (기본/도전 난이도 지원)
 */

export const GAME_QUESTIONS = {
  // 1. 미로 찾기 (Maze Explorer)
  maze: {
    basic: [
      {
        id: 'maze-b1',
        clueTitle: '별과 은하의 비밀 탐구!',
        clue: '칼 세이건의 책 『코스모스』처럼, 우주와 별을 연구하는 천문학 책을 찾아 탈출하세요!',
        targetClass: '440',
        targetSubject: '천문학 (순수과학 400)',
        correctBookId: 'b-003',
        options: [
          { code: '440', label: '440 천문학', isCorrect: true, hint: '우주와 별은 순수과학 400번대(440 천문학)에 있어요!' },
          { code: '180', label: '180 심리학', isCorrect: false, hint: '180은 마음에 대해 탐구하는 철학 분야예요.' },
          { code: '710', label: '710 한국어', isCorrect: false, hint: '710은 우리말을 연구하는 언어 분야예요.' },
          { code: '911', label: '911 한국사', isCorrect: false, hint: '911은 우리나라 역사를 다루는 900번대 역사예요.' }
        ]
      },
      {
        id: 'maze-b2',
        clueTitle: '임진왜란과 이순신 장군!',
        clue: '충무공 이순신의 『난중일기』를 찾아 서가를 탈출하세요! 역사 책은 어디에 있을까요?',
        targetClass: '911',
        targetSubject: '한국사 (역사 900)',
        correctBookId: 'b-004',
        options: [
          { code: '911', label: '911 한국사', isCorrect: true, hint: '이순신 장군의 일기와 한국 역사는 900번대(911)에 있어요!' },
          { code: '320', label: '320 경제학', isCorrect: false, hint: '320은 돈과 시장을 다루는 사회과학 분야예요.' },
          { code: '511', label: '511 의학', isCorrect: false, hint: '511은 인체와 건강을 다루는 기술과학 분야예요.' },
          { code: '810', label: '810 한국문학', isCorrect: false, hint: '810은 한국문학(소설·시)이에요. 난중일기는 사료로서 911에 분류됩니다.' }
        ]
      },
      {
        id: 'maze-b3',
        clueTitle: '장미와 여우의 소년!',
        clue: '생텍쥐페리의 프랑스 명작 소설 『어린 왕자』를 찾아 미로를 빠져나가세요!',
        targetClass: '863',
        targetSubject: '프랑스소설 (문학 800)',
        correctBookId: 'b-001',
        options: [
          { code: '863', label: '863 프랑스소설', isCorrect: true, hint: '프랑스 작가의 문학 소설은 800번대 중 860번대(863)에 있어요!' },
          { code: '219', label: '219 신화', isCorrect: false, hint: '219는 그리스 로마 신화 같은 종교 분야예요.' },
          { code: '004', label: '004 컴퓨터', isCorrect: false, hint: '004는 소프트웨어와 코딩을 다루는 총류 분야예요.' },
          { code: '650', label: '650 회화/미술', isCorrect: false, hint: '650은 그림과 미술을 다루는 예술 분야예요.' }
        ]
      }
    ],
    challenge: [
      {
        id: 'maze-c1',
        clueTitle: '달콤한 디저트 쿠키 굽기!',
        clue: '초코칩 쿠키 레시피가 적힌 책 『달콤한 디저트 교실』을 서가에서 찾아내세요!',
        targetClass: '594',
        targetSubject: '요리/가정생활 (기술과학 500)',
        correctBookId: 'b-015',
        options: [
          { code: '594', label: '594 요리/제과', isCorrect: true, hint: '요리, 음식, 영양학은 기술과학 500번대의 590(생활과학)에 해당해요!' },
          { code: '430', label: '430 화학', isCorrect: false, hint: '430은 원소와 분자를 연구하는 순수과학이에요.' },
          { code: '690', label: '690 스포츠/오락', isCorrect: false, hint: '690은 운동이나 게임 등을 다루는 예술/오락이에요.' },
          { code: '031', label: '031 백과사전', isCorrect: false, hint: '031은 백과사전으로 총류에 속해요.' }
        ]
      },
      {
        id: 'maze-c2',
        clueTitle: '어린이 블록 코딩 프로그래밍!',
        clue: '스크래치로 컴퓨터 게임을 만드는 『어린이 코딩 첫걸음』 책을 찾아보세요!',
        targetClass: '004.7',
        targetSubject: '컴퓨터과학 (총류 000)',
        correctBookId: 'b-008',
        options: [
          { code: '004.7', label: '004.7 프로그래밍', isCorrect: true, hint: '컴퓨터와 소프트웨어는 000번대(총류 004)에 속합니다!' },
          { code: '540', label: '540 기계공학', isCorrect: false, hint: '540은 자동차나 엔진 같은 기계를 다루는 공학이에요.' },
          { code: '740', label: '740 영어', isCorrect: false, hint: '740은 영어 회화와 문법을 다루는 언어 분야예요.' },
          { code: '370', label: '370 교육학', isCorrect: false, hint: '370은 학교 교육과 교수법을 다루는 사회과학이에요.' }
        ]
      }
    ]
  },

  // 2. 블록 맞추기 (Shelf Sorter: 순서대로 배열 / 청구기호 조립)
  shelfSort: {
    basic: [
      {
        id: 'sort-b1',
        title: '분류번호 오름차순 서가 정렬',
        instructions: '서가 배열 규칙에 맞춰 책들을 왼쪽(작은 번호)에서 오른쪽(큰 번호) 순서로 정렬하세요.',
        items: [
          { id: 'item-1', code: '020', title: '도서관 이야기', author: '강02', rank: 1 },
          { id: 'item-2', code: '180', title: '마음의 법칙', author: '김34', rank: 2 },
          { id: 'item-3', code: '410', title: '수학귀신', author: '엔84', rank: 3 },
          { id: 'item-4', code: '813', title: '아몬드', author: '손68', rank: 4 }
        ],
        explanation: 'KDC 대분류 원칙: 000(총류) → 100(철학) → 400(순수과학) → 800(문학) 순으로 작은 번호부터 배열됩니다.'
      },
      {
        id: 'sort-b2',
        title: '문학 소설 저자기호 가나다 정렬',
        instructions: '분류번호가 같은 813(한국소설) 책들입니다. 저자기호 가나다순으로 왼쪽부터 올바르게 배치하세요.',
        items: [
          { id: 'item-1', code: '813.6', title: '봄봄', authorNo: '김68ㅂ', rank: 1 },
          { id: 'item-2', code: '813.6', title: '자전거 도둑', authorNo: '박69ㅈ', rank: 2 },
          { id: 'item-3', code: '813.6', title: '아몬드', authorNo: '손68ㅇ', rank: 3 },
          { id: 'item-4', code: '813.6', title: '소나기', authorNo: '황84ㅅ', rank: 4 }
        ],
        explanation: '분류번호(813.6)가 같으면 저자기호(김 → 박 → 손 → 황)의 가나다순으로 서가에 꽂힙니다.'
      }
    ],
    challenge: [
      {
        id: 'sort-c1',
        title: '소수점과 권차기호가 섞인 실전 서가 정렬',
        instructions: '도서관 실제 서가 배열에 맞추어 오름차순으로 완벽하게 배치하세요.',
        items: [
          { id: 'item-1', code: '813.6', title: '동백꽃', authorNo: '김68ㄷ', rank: 1 },
          { id: 'item-2', code: '813.62', title: '마당을 나온 암탉', authorNo: '황62ㅁ', rank: 2 },
          { id: 'item-3', code: '843', title: '해리 포터 1권', authorNo: '롤297ㅎ v.1', rank: 3 },
          { id: 'item-4', code: '843', title: '해리 포터 2권', authorNo: '롤297ㅎ v.2', rank: 4 },
          { id: 'item-5', code: '911', title: '한국사 탐험', authorNo: '금74ㅎ', rank: 5 }
        ],
        explanation: '소수점 비교(813.6 < 813.62) 후 843의 같은 책은 1권(v.1)이 2권(v.2)보다 먼저 옵니다!'
      }
    ]
  },

  // 3. 외계인 방어 (Space Invaders)
  spaceDefense: {
    basic: [
      {
        id: 'space-b1',
        clue: '외계인이 침략했다! [한국의 역사/조선왕조] 관련 우주선을 격추하라!',
        targetClass: '911',
        options: ['911', '320', '410', '710'],
        explanation: '한국사는 KDC 911(역사 900번대)입니다!'
      },
      {
        id: 'space-b2',
        clue: '우주 사령부 보고: [그림, 미술, 회화] 관련 번호 외계인을 쏴라!',
        targetClass: '650',
        options: ['650', '180', '540', '810'],
        explanation: '미술과 회화는 예술 600번대의 650입니다!'
      },
      {
        id: 'space-b3',
        clue: '긴급! [수학과 기하학의 원리] 우주선을 요격하라!',
        targetClass: '410',
        options: ['410', '004', '220', '920'],
        explanation: '수학은 순수과학 400번대의 410입니다!'
      },
      {
        id: 'space-b4',
        clue: '위기 발생! [영단어와 영어 문법] 침공 우주선을 파괴하라!',
        targetClass: '740',
        options: ['740', '590', '863', '190'],
        explanation: '영어는 언어 700번대의 740입니다!'
      }
    ],
    challenge: [
      {
        id: 'space-c1',
        clue: '도전 침공! [정치, 법률, 헌법과 사회 제도] 외계 편대를 막아라!',
        targetClass: '360',
        options: ['360', '670', '480', '813'],
        explanation: '법학과 헌법은 사회과학 300번대의 360입니다!'
      },
      {
        id: 'space-c2',
        clue: '초강력 보스전! [의학과 인체 질병 치료] 우주선을 조준하라!',
        targetClass: '510',
        options: ['510', '210', '720', '030'],
        explanation: '의학과 약학은 기술과학 500번대의 510입니다!'
      }
    ]
  },

  // 4. 벽돌 깨기 (Brick Breaker)
  brickBreaker: {
    basic: [
      {
        id: 'brick-b1',
        missionText: '타깃 미션: [순수과학 400번대] 벽돌을 모두 깨뜨려라!',
        targetCategory: '400',
        targetLabel: '400 순수과학',
        explanation: '400번대는 수학(410), 물리(420), 천문(440), 동물/식물 등을 포함하는 순수과학입니다.'
      },
      {
        id: 'brick-b2',
        missionText: '타깃 미션: [문학 800번대] 벽돌을 정밀 타격하라!',
        targetCategory: '800',
        targetLabel: '800 문학',
        explanation: '800번대는 한국문학(810), 영미문학(840), 프랑스문학(860) 등 모든 소설·시를 포함합니다.'
      }
    ],
    challenge: [
      {
        id: 'brick-c1',
        missionText: '고난도 미션: [철학 100번대]와 [기술과학 500번대]를 차례로 격파하라!',
        targetCategory: '100_500',
        targetLabel: '100 철학 & 500 기술과학',
        explanation: '100번대는 심리/윤리/철학, 500번대는 의학/공학/생활과학(요리)입니다.'
      }
    ]
  },

  // 5. 뱀 길 만들기 (Snake Adventure)
  snake: {
    basic: [
      {
        id: 'snake-b1',
        title: '서가 배열 번호 순서대로 먹기',
        sequence: [
          { code: '030', label: '030 백과사전', order: 1 },
          { code: '210', label: '210 신화', order: 2 },
          { code: '440', label: '440 천문학', order: 3 },
          { code: '810', label: '810 한국문학', order: 4 }
        ],
        explanation: '책벌레가 서가를 여행할 땐 반드시 번호가 작은 순서(030 → 210 → 440 → 810)로 먹어야 몸이 건강하게 자랍니다!'
      },
      {
        id: 'snake-b2',
        title: '대분류 오름차순 행진',
        sequence: [
          { code: '100', label: '100 철학', order: 1 },
          { code: '300', label: '300 사회과학', order: 2 },
          { code: '600', label: '600 예술', order: 3 },
          { code: '900', label: '900 역사', order: 4 }
        ],
        explanation: '도서관 복도 서가 순서: 100 철학 → 300 사회과학 → 600 예술 → 900 역사!'
      }
    ],
    challenge: [
      {
        id: 'snake-c1',
        title: '소수점 세부 번호 순서 행진',
        sequence: [
          { code: '811', label: '811 한국시', order: 1 },
          { code: '813.5', label: '813.5 근대소설', order: 2 },
          { code: '813.7', label: '813.7 현대소설', order: 3 },
          { code: '843', label: '843 영국소설', order: 4 },
          { code: '911', label: '911 한국사', order: 5 }
        ],
        explanation: '811 < 813.5 < 813.7 < 843 < 911 순서로 정확하게 정렬된 청구기호 경로입니다!'
      }
    ]
  },

  // 6. 두더지 고르기 (Whack-a-Mole)
  whackMole: {
    basic: [
      {
        id: 'mole-b1',
        prompt: '김유정이 쓴 『봄봄』! 글쓴이 성 "김"으로 시작하고 제목 첫소리 "ㅂ"으로 끝나는 저자기호를 잡아요.',
        targetCode: '김68ㅂ',
        moles: [
          { code: '김68ㅂ', isTarget: true, desc: '김유정의 "봄봄" (정답!)' },
          { code: '이58ㄴ', isTarget: false, desc: '이순신의 "난중일기"' },
          { code: '손68ㅇ', isTarget: false, desc: '손원평의 "아몬드"' },
          { code: '박69ㄱ', isTarget: false, desc: '박완서 작가' }
        ],
        explanation: '저자기호 = 글쓴이 성(김) + 이름 번호(68) + 제목 첫 글자 "봄"의 첫소리(ㅂ) → 김68ㅂ. 번호는 사서 선생님이 표를 보고 정해요.'
      },
      {
        id: 'mole-b2',
        prompt: '이순신 장군이 쓴 『난중일기』! 글쓴이 성 "이"로 시작하고 제목 첫소리 "ㄴ"으로 끝나는 저자기호를 잡아요.',
        targetCode: '이58ㄴ',
        moles: [
          { code: '이58ㄴ', isTarget: true, desc: '이순신의 "난중일기" (정답!)' },
          { code: '황84ㅅ', isTarget: false, desc: '황순원의 "소나기"' },
          { code: '생83ㅇ', isTarget: false, desc: '생텍쥐페리' },
          { code: '윤46ㅎ', isTarget: false, desc: '윤동주 시인' }
        ],
        explanation: '저자기호 = 글쓴이 성(이) + 이름 번호(58) + 제목 첫 글자 "난"의 첫소리(ㄴ) → 이58ㄴ'
      },
      {
        id: 'mole-b3',
        prompt: '단서: [컴퓨터 소프트웨어와 프로그래밍]의 KDC 6판 분류번호는?',
        targetCode: '004',
        moles: [
          { code: '004', isTarget: true, desc: '004 컴퓨터과학 (정답!)' },
          { code: '590', isTarget: false, desc: '590 생활과학/요리' },
          { code: '320', isTarget: false, desc: '320 경제학' },
          { code: '710', isTarget: false, desc: '710 한국어' }
        ],
        explanation: '컴퓨터과학과 정보처리는 KDC 총류(000번대)의 004에 해당합니다!'
      }
    ],
    challenge: [
      {
        id: 'mole-c1',
        prompt: '813.6 책꽂이에 김68ㅂ, 박69ㅈ, 손68ㅇ, 황84ㅅ 네 권이 함께 꽂혀요. "박69ㅈ" 바로 다음(오른쪽)에 꽂히는 저자기호를 잡아요!',
        targetCode: '손68ㅇ',
        moles: [
          { code: '손68ㅇ', isTarget: true, desc: '손원평의 "아몬드" (정답!)' },
          { code: '김68ㅂ', isTarget: false, desc: '김유정의 "봄봄" (박보다 앞)' },
          { code: '황84ㅅ', isTarget: false, desc: '황순원의 "소나기" (맨 뒤)' },
          { code: '박69ㅈ', isTarget: false, desc: '박완서 (기준 책)' }
        ],
        explanation: '번호가 같으면 저자기호 가나다순: 김68ㅂ → 박69ㅈ → 손68ㅇ → 황84ㅅ. 그래서 박 다음은 손!'
      },
      {
        id: 'mole-c2',
        prompt: '단서: [세종대왕의 훈민정음과 한국어학]의 KDC 분류번호는?',
        targetCode: '710',
        moles: [
          { code: '710', isTarget: true, desc: '710 한국어 (정답!)' },
          { code: '911', isTarget: false, desc: '911 한국사' },
          { code: '810', isTarget: false, desc: '810 한국문학' },
          { code: '130', isTarget: false, desc: '130 동양철학' }
        ],
        explanation: '국어학과 우리말 구조는 언어(700번대)의 710(한국어)에 분류됩니다!'
      }
    ]
  }
};
