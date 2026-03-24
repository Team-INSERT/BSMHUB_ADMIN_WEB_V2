import { UserDetailType } from '../data/schema'

export type FT = UserDetailType['field_training'][number]
export type EMP = UserDetailType['employment_companies'][number]
export type MS = UserDetailType['military_services'][number]
export type UNIV = UserDetailType['student_universities'][number]

export type CareerItem =
  | { type: 'field_training'; data: FT; startDate: Date }
  | { type: 'employment'; data: EMP; startDate: Date }
  | { type: 'military_service'; data: MS; startDate: Date }

export type OverlapAdjustment =
  | { kind: 'trim-end'; newEnd: Date }    // 기존 end를 newStart-1로 자름
  | { kind: 'push-start'; newStart: Date } // 기존 start를 newEnd+1로 밀어냄
  | { kind: 'block' }                     // 완전히 덮혀서 불가능

export type OverlapTarget =
  | { type: 'field_training'; target: FT; adjustment: OverlapAdjustment }
  | { type: 'employment'; target: EMP; adjustment: OverlapAdjustment }

export const FAR_FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

export const RESIGNATION_REASONS = ['졸업', '계약 만료', '자진 퇴사', '권고 사직']
