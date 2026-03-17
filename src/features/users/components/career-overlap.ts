import { FAR_FUTURE, OverlapAdjustment, OverlapTarget, FT, EMP } from './career-types'
import { parseLocalDate } from './career-utils'

const rangesOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart.getTime() <= bEnd.getTime() && aEnd.getTime() >= bStart.getTime()

export function calcAdjustment(newStart: Date, newEnd: Date, existStart: Date, existEnd: Date): OverlapAdjustment {
  if (newStart.getTime() > existStart.getTime()) {
    // 수정 레코드가 기존 레코드 중간에서 시작 → 기존 end를 newStart-1로 자름
    return { kind: 'trim-end', newEnd: new Date(newStart.getTime() - 86400000) }
  } else {
    // 수정 레코드가 기존 레코드 시작과 같거나 앞 → 기존 start를 newEnd+1로 밀어냄
    const pushedStart = new Date(newEnd.getTime() + 86400000)
    if (pushedStart.getTime() > existEnd.getTime()) {
      // 기존 레코드를 완전히 덮어버림 → 불가능
      return { kind: 'block' }
    }
    return { kind: 'push-start', newStart: pushedStart }
  }
}

export function checkOverlaps(
  newStart: Date,
  newEnd: Date,
  selfKey: string,
  allFT: FT[],
  allEMP: EMP[]
): OverlapTarget[] {
  const results: OverlapTarget[] = []
  for (const ft of allFT) {
    const ftKey = `ft-${ft.company_id}-${ft.job_id}-${ft.start_date}`
    if (ftKey === selfKey || !!ft.deleted_at) continue
    const existStart = parseLocalDate(ft.start_date)
    const existEnd = ft.end_date ? parseLocalDate(ft.end_date) : FAR_FUTURE
    if (!rangesOverlap(newStart, newEnd, existStart, existEnd)) continue
    results.push({ type: 'field_training', target: ft, adjustment: calcAdjustment(newStart, newEnd, existStart, existEnd) })
  }
  for (const emp of allEMP) {
    const empKey = `emp-${emp.company_id}-${emp.job_id}-${emp.start_date}`
    if (empKey === selfKey || !!emp.deleted_at) continue
    const existStart = parseLocalDate(emp.start_date)
    const existEnd = emp.end_date ? parseLocalDate(emp.end_date) : FAR_FUTURE
    if (!rangesOverlap(newStart, newEnd, existStart, existEnd)) continue
    results.push({ type: 'employment', target: emp, adjustment: calcAdjustment(newStart, newEnd, existStart, existEnd) })
  }
  return results
}
