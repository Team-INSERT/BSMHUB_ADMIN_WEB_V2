export const CLEANER_DATASETS = [
  {
    field: 'attendance_file',
    label: '출결 데이터',
    description: '학생별 출석 시트를 업로드하세요.',
  },
  {
    field: 'award_file',
    label: '수상 데이터',
    description: '교내·외 수상 실적을 포함한 시트를 첨부합니다.',
  },
  {
    field: 'certificate_file',
    label: '자격증 데이터',
    description: '취득 자격증 목록 시트를 업로드하세요.',
  },
  {
    field: 'grade_file',
    label: '성적 데이터',
    description: '학기별 성적표 또는 누적 성적 시트를 첨부합니다.',
  },
  {
    field: 'volunteerism_file',
    label: '봉사 데이터',
    description: '봉사 시간/활동 내역이 담긴 시트를 업로드하세요.',
  },
  {
    field: 'label_file',
    label: '레이블 데이터',
    description: '모델 학습에 사용할 정답 레이블 시트를 업로드하세요.',
  },
] as const

export type CleanerDatasetField =
  (typeof CLEANER_DATASETS)[number]['field']

export const CLEANER_GENERATIONS = [
  { value: 1, label: '1기', year: 2021 },
  { value: 2, label: '2기', year: 2022 },
  { value: 3, label: '3기', year: 2023 },
  { value: 4, label: '4기', year: 2024 },
] as const

export type CleanerGenerationValue =
  (typeof CLEANER_GENERATIONS)[number]['value']

export const DEFAULT_GENERATION =
  CLEANER_GENERATIONS[CLEANER_GENERATIONS.length - 1]?.value ?? 1
export const SAMPLE_STUDENT_HASH = 'student_hash_demo'
export const ALL_GENERATIONS_TAB = 'all'
export type CleanerGenerationTabValue =
  | CleanerGenerationValue
  | typeof ALL_GENERATIONS_TAB
