export const toDateStr = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const toDateTimeStr = (date: Date) =>
  `${toDateStr(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`

export const toLocalMidnight = (date: Date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// "YYYY-MM-DD..." 형식 문자열을 로컬 자정 Date로 파싱 (UTC 파싱 방지)
export const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('T')[0].split(' ')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const isInRanges = (date: Date, ranges: { from: Date; to: Date }[]) => {
  const d = toLocalMidnight(date).getTime()
  return ranges.some((r) => {
    const from = toLocalMidnight(r.from).getTime()
    const to = toLocalMidnight(r.to).getTime()
    return d >= from && d <= to
  })
}
