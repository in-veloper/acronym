// 아이콘 색에서 가져왔어요: 남색 카드, 노란 A, 빨간 색연필, 초록 체크
export const colors = {
  bg: '#FAF6EC',
  paper: '#FFFFFF',
  navy: '#1D2350',
  ink: '#1D2350',
  inkSoft: '#6D7194',
  inkFaint: '#A9ACC4',
  line: '#EDE6D5',
  chip: '#F0EADB',
  yellow: '#FFB81C',
  yellowSoft: '#FFF1C9',
  pencil: '#E5484D',
  good: '#27B36A',
  goodSoft: '#DDF4E8',
  scrim: 'rgba(20, 24, 58, 0.55)',
};

// 글자는 전부 Wanted Sans 한 가지 — 굵기만 바꿔서 쓴다
export const font = {
  regular: 'WantedSans-Regular',
  medium: 'WantedSans-Medium',
  semibold: 'WantedSans-SemiBold',
  bold: 'WantedSans-Bold',
  extrabold: 'WantedSans-ExtraBold',
  black: 'WantedSans-Black',
};

export const radius = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 };

export const SUBJECT_COLORS = [
  '#F2674B',
  '#F5A524',
  '#7FB23E',
  '#1FA896',
  '#3E7BEA',
  '#6B5CE0',
  '#C05BC0',
  '#5C6A82',
];

export const tint = (hex, alpha = '22') => `${hex}${alpha}`;

export const shadow = {
  shadowColor: '#1D2350',
  shadowOpacity: 0.1,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};
