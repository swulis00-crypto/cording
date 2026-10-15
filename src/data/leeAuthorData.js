/**
 * 이재철 저자기호표 (제5표) 원리 및 규칙 안내 데이터
 */

export const LEE_AUTHOR_RULES = {
  title: '이재철 저자기호표 제5표란?',
  summary: '한국 도서관에서 가장 널리 쓰이는 저자기호 체계로, 저자의 성명과 책 제목을 조합하여 청구기호의 두 번째 줄(도서기호)을 완성합니다.',
  structure: [
    {
      part: '저자의 성(첫 글자)',
      explain: '한글 저자명의 첫 글자(성)를 그대로 한글로 표기합니다.',
      example: '김유정 ➔ "김", 박완서 ➔ "박", 이순신 ➔ "이"'
    },
    {
      part: '저자 번호 (2~3자리 숫자)',
      explain: '이름의 두 번째 글자의 초성 자음과 모음에 따라 번호표에서 정해진 숫자를 배정합니다.',
      example: '유정 ➔ "68" (김68), 완서 ➔ "69" (박69), 순신 ➔ "58" (이58)'
    },
    {
      part: '도서기호 / 표제 초자 (책 제목 첫 글자)',
      explain: '같은 저자가 쓴 책을 구별하기 위해 책 제목 첫 글자(또는 초성 자음)를 붙입니다.',
      example: '봄봄 ➔ "ㅂ" (김68ㅂ), 소나기 ➔ "ㅅ" (황84ㅅ)'
    },
    {
      part: '권차기호 및 복본기호',
      explain: '여러 권으로 된 책은 권차(v.1, v.2, 또는 =1, =2), 복본(동일 책 복사본)은 c.1, c.2를 덧붙입니다.',
      example: '해리포터 1권 ➔ 롤297ㅎ v.1'
    }
  ],
  callNumberVisualExample: {
    badge: '청',
    classNumber: '813.7',
    authorNumber: '김68ㅂ',
    volumeNumber: 'v.1',
    copyNumber: 'c.2',
    explanation: [
      { tag: '별치기호', code: '청', desc: '청소년 도서실 서가에 위치함을 알림' },
      { tag: '분류기호', code: '813.7', desc: '한국현대소설 (KDC 6판 800번대 문학)' },
      { tag: '저자기호', code: '김68ㅂ', desc: '김유정 작가의 "봄봄" 책을 뜻함' },
      { tag: '권차기호', code: 'v.1', desc: '1권 (시리즈물인 경우)' },
      { tag: '복본기호', code: 'c.2', desc: '도서관에 있는 똑같은 책 2번째 권' }
    ]
  },
  sampleAuthors: [
    { name: '김유정', title: '봄봄', code: '김68ㅂ', classNo: '813.6', subject: '한국 근대소설' },
    { name: '황순원', title: '소나기', code: '황84ㅅ', classNo: '813.6', subject: '한국 단편소설' },
    { name: '윤동주', title: '하늘과 바람과 별과 시', code: '윤46ㅎ', classNo: '811.6', subject: '한국 현대시' },
    { name: '박완서', title: '그 많던 싱아는 누가 다 먹었을까', code: '박69ㄱ', classNo: '813.7', subject: '한국 현대소설' },
    { name: '이순신', title: '난중일기', code: '이58ㄴ', classNo: '911.05', subject: '조선 역사 / 일기' },
    { name: '손원평', title: '아몬드', code: '손68ㅇ', classNo: '813.7', subject: '청소년 문학' },
    { name: '정약용', title: '목민심서', code: '정62ㅁ', classNo: '350.9', subject: '조선 행정 / 정치' },
    { name: '생텍쥐페리', title: '어린 왕자', code: '생83ㅇ', classNo: '863', subject: '프랑스 문학' },
    { name: '롤링', title: '해리 포터와 마법사의 돌', code: '롤297ㅎ', classNo: '843', subject: '영미 판타지 소설' },
    { name: '세이건', title: '코스모스', code: '세67ㅋ', classNo: '440', subject: '천문학 / 우주과학' }
  ]
};
