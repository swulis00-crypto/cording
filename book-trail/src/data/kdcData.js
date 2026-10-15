/**
 * 한국십진분류법 (KDC) 제6판 데이터 및 교육 자료
 */

export const KDC_MAIN_CLASSES = [
  {
    code: '000',
    name: '총류',
    summary: '백과사전, 컴퓨터과학, 도서관학, 일반 학문',
    color: '#6366f1',
    accentBg: 'rgba(99, 102, 241, 0.15)',
    icon: '💻',
    divisions: [
      { code: '004', name: '컴퓨터과학 / 정보처리' },
      { code: '010', name: '도서학 / 서지학' },
      { code: '020', name: '문헌정보학 / 도서관학' },
      { code: '030', name: '백과사전' },
      { code: '050', name: '일반 연속간행물 / 잡지' },
      { code: '080', name: '일반전집 / 총서' }
    ],
    examples: ['어린이 백과사전', '스크래치 코딩 첫걸음', '도서관 이야기']
  },
  {
    code: '100',
    name: '철학',
    summary: '생각, 마음, 심리학, 도덕과 윤리, 논리학',
    color: '#8b5cf6',
    accentBg: 'rgba(139, 92, 246, 0.15)',
    icon: '🧠',
    divisions: [
      { code: '110', name: '형이상학' },
      { code: '130', name: '동양철학' },
      { code: '160', name: '서양철학' },
      { code: '180', name: '심리학' },
      { code: '190', name: '윤리학 / 도덕' }
    ],
    examples: ['소크라테스의 변명', '어린이를 위한 심리학', '청소년이 묻고 철학이 답하다']
  },
  {
    code: '200',
    name: '종교',
    summary: '신화, 불교, 기독교, 민속 신앙',
    color: '#ec4899',
    accentBg: 'rgba(236, 72, 153, 0.15)',
    icon: '✨',
    divisions: [
      { code: '210', name: '비교종교학 / 신화' },
      { code: '220', name: '불교' },
      { code: '230', name: '기독교' },
      { code: '240', name: '도교' },
      { code: '250', name: '천도교' },
      { code: '290', name: '이슬람교 / 기타 종교' }
    ],
    examples: ['만화로 보는 그리스 로마 신화', '단군 신화 이야기', '부처님 생애']
  },
  {
    code: '300',
    name: '사회과학',
    summary: '정치, 경제, 사회, 법, 교육, 풍속',
    color: '#3b82f6',
    accentBg: 'rgba(59, 130, 246, 0.15)',
    icon: '🏛️',
    divisions: [
      { code: '310', name: '통계학' },
      { code: '320', name: '경제학' },
      { code: '330', name: '사회학 / 사회문제' },
      { code: '340', name: '정치학' },
      { code: '350', name: '행정학' },
      { code: '360', name: '법학' },
      { code: '370', name: '교육학' },
      { code: '380', name: '풍속 / 민속학' }
    ],
    examples: ['어린이 돈 공부 경제 동화', '우리 헌법 바로 알기', '세계의 명절과 축제']
  },
  {
    code: '400',
    name: '순수과학',
    summary: '수학, 우주/천문학, 물리, 화학, 지구, 생명',
    color: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.15)',
    icon: '🔬',
    divisions: [
      { code: '410', name: '수학' },
      { code: '420', name: '물리학' },
      { code: '430', name: '화학' },
      { code: '440', name: '천문학 / 우주과학' },
      { code: '450', name: '지구과학 / 지질학' },
      { code: '470', name: '식물학' },
      { code: '480', name: '동물학' },
      { code: '490', name: '미생물학 / 곤충' }
    ],
    examples: ['수학귀신', '코스모스 우주 탐험', '신기한 동물 사전']
  },
  {
    code: '500',
    name: '기술과학',
    summary: '의학, 요리/가정, 기계, 공학, 농업',
    color: '#14b8a6',
    accentBg: 'rgba(20, 184, 166, 0.15)',
    icon: '⚙️',
    divisions: [
      { code: '510', name: '의학 / 약학 / 보건' },
      { code: '520', name: '농업 / 원예' },
      { code: '530', name: '공학 / 기술' },
      { code: '540', name: '기계공학' },
      { code: '560', name: '전기·전자공학' },
      { code: '590', name: '생활과학 / 요리 / 의류' }
    ],
    examples: ['우리 몸의 비밀 (인체)', '어린이 제과제빵 요리책', '미래 로봇 만들기']
  },
  {
    code: '600',
    name: '예술',
    summary: '그림/미술, 음악, 체육/스포츠, 사진, 건축',
    color: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.15)',
    icon: '🎨',
    divisions: [
      { code: '610', name: '건축술' },
      { code: '620', name: '조각 / 도예' },
      { code: '630', name: '공예 / 장식' },
      { code: '640', name: '서예' },
      { code: '650', name: '회화 / 미술' },
      { code: '660', name: '사진술' },
      { code: '670', name: '음악' },
      { code: '680', name: '공연예술 / 연극 / 영화' },
      { code: '690', name: '오락 / 스포츠 / 체육' }
    ],
    examples: ['반 고흐의 미술관', '신나는 클래식 음악 여행', '손흥민의 축구 교실']
  },
  {
    code: '700',
    name: '언어',
    summary: '국어/한국어, 영어, 한자, 세계 여러 언어',
    color: '#06b6d4',
    accentBg: 'rgba(6, 182, 212, 0.15)',
    icon: '🗣️',
    divisions: [
      { code: '710', name: '한국어 / 국어' },
      { code: '720', name: '중국어' },
      { code: '730', name: '일본어' },
      { code: '740', name: '영어' },
      { code: '750', name: '독일어' },
      { code: '760', name: '프랑스어' }
    ],
    examples: ['국어사전', '재미있는 우리말 속담 사전', '초등 필수 영단어 1000']
  },
  {
    code: '800',
    name: '문학',
    summary: '동화, 소설, 시, 수필, 세계 문학',
    color: '#f43f5e',
    accentBg: 'rgba(244, 63, 94, 0.15)',
    icon: '📚',
    divisions: [
      { code: '810', name: '한국문학 (소설·시·동화)' },
      { code: '820', name: '중국문학' },
      { code: '830', name: '일본문학' },
      { code: '840', name: '영미문학 (영국·미국 소설)' },
      { code: '850', name: '독일문학' },
      { code: '860', name: '프랑스문학' },
      { code: '870', name: '스페인문학' }
    ],
    examples: ['어린 왕자 (프랑스문학)', '해리 포터 (영미문학)', '몽실 언니 (한국문학)', '아몬드']
  },
  {
    code: '900',
    name: '역사',
    summary: '한국사, 세계사, 지리/지도, 위인전',
    color: '#eab308',
    accentBg: 'rgba(234, 179, 8, 0.15)',
    icon: '🗺️',
    divisions: [
      { code: '910', name: '아시아사 / 한국사(911)' },
      { code: '920', name: '유럽사' },
      { code: '930', name: '아프리카사' },
      { code: '940', name: '북아메리카사' },
      { code: '980', name: '지리 / 지도 / 여행' },
      { code: '990', name: '전기 / 위인전' }
    ],
    examples: ['용선생의 시끌벅적 한국사', '세종대왕 위인전', '세계 지도 그림책']
  }
];

export const SHELF_SORT_RULES = [
  {
    step: 1,
    title: '분류번호 크기 순서대로 정렬',
    description: '분류번호 숫자가 작은 것부터 큰 순서대로 왼쪽에서 오른쪽으로 꽂힙니다. (000 → 900)'
  },
  {
    step: 2,
    title: '소수점은 십진수 순서로 비교',
    description: '소수점 아래 숫자는 자리수별로 비교합니다. 예: 813.6 이 813.62 보다 앞이고, 813.7 은 그 뒤입니다.'
  },
  {
    step: 3,
    title: '분류번호가 같으면 저자기호 순서',
    description: '동일한 주제(분류번호) 내에서는 저자의 성명 순서(가나다 / 알파벳 순)로 정리합니다.'
  },
  {
    step: 4,
    title: '저자기호가 같으면 도서명 기호 순서',
    description: '같은 저자의 책이 여러 권이면 책 제목 첫 글자(가나다순)로 구별합니다.'
  },
  {
    step: 5,
    title: '권차기호 및 복본기호 순서',
    description: '시리즈 책은 1권(v.1), 2권(v.2) 순으로, 똑같은 책이 2권 이상이면 c.1, c.2 순으로 놓입니다.'
  }
];
