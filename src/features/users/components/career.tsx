import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ko } from 'date-fns/locale'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
} from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/formatDate'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCompanyListQuery } from '@/features/companies/services/selectCompanyList'
import { useUsers } from '../context/users-context'
import { UserDetailType } from '../data/schema'
import { useHandleEmploymentMutation } from '../services/employment-companies/handleEmployment'
import { useHandleFieldTrainingMutation } from '../services/field-training/handleFieldTraining'
import { useJobListQuery } from '../services/field-training/selectJobList'
import { AddFieldTrainingOption } from './add-field-training-option'
import { CareerOverlapDialog, OverlapInfo } from './career-overlap-dialog'
import FieldTrainingEndDialog from './field-training-end-dialog'

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

const toDateStr = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const toDateTimeStr = (date: Date) =>
  `${toDateStr(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`

const toLocalMidnight = (date: Date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// "YYYY-MM-DD..." 형식 문자열을 로컬 자정 Date로 파싱 (UTC 파싱 방지)
const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('T')[0].split(' ')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

const isInRanges = (date: Date, ranges: { from: Date; to: Date }[]) => {
  const d = toLocalMidnight(date).getTime()
  return ranges.some((r) => {
    const from = toLocalMidnight(r.from).getTime()
    const to = toLocalMidnight(r.to).getTime()
    return d >= from && d <= to
  })
}

type FT = UserDetailType['field_training'][number]
type EMP = UserDetailType['employment_companies'][number]

// ─── 겹침 감지 ─────────────────────────────────────────────────────────────────

const FAR_FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

const rangesOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart.getTime() <= bEnd.getTime() && aEnd.getTime() >= bStart.getTime()

function findAllOverlaps(
  newStart: Date,
  newEnd: Date,
  selfKey: string,
  allFT: FT[],
  allEMP: EMP[]
): OverlapInfo[] {
  const results: OverlapInfo[] = []
  for (const ft of allFT) {
    const ftKey = `ft-${ft.company_id}-${ft.job_id}-${ft.start_date}`
    if (ftKey === selfKey || !!ft.deleted_at) continue
    const s = parseLocalDate(ft.start_date)
    const e = ft.end_date ? parseLocalDate(ft.end_date) : FAR_FUTURE
    if (rangesOverlap(newStart, newEnd, s, e))
      results.push({
        type: 'field_training',
        companyName: ft.companies?.company_name ?? '',
        startDate: ft.start_date,
        endDate: ft.end_date,
      })
  }
  for (const emp of allEMP) {
    const empKey = `emp-${emp.company_id}-${emp.job_id}-${emp.start_date}`
    if (empKey === selfKey || !!emp.deleted_at) continue
    const s = parseLocalDate(emp.start_date)
    const e = emp.end_date ? parseLocalDate(emp.end_date) : FAR_FUTURE
    if (rangesOverlap(newStart, newEnd, s, e))
      results.push({
        type: 'employment',
        companyName: emp.companies?.company_name ?? '',
        startDate: emp.start_date,
        endDate: emp.end_date,
      })
  }
  return results
}

// ─── 통합 경력 항목 타입 ───────────────────────────────────────────────────────

type CareerItem =
  | { type: 'field_training'; data: FT; startDate: Date }
  | { type: 'employment'; data: EMP; startDate: Date }

// ─── 현장실습 카드 ─────────────────────────────────────────────────────────────

function FieldTrainingCard({
  ft,
  studentId,
  allFT,
  allEMP,
}: {
  ft: FT
  studentId: string
  allFT: FT[]
  allEMP: EMP[]
}) {
  const selfKey = `ft-${ft.company_id}-${ft.job_id}-${ft.start_date}`
  const [isOpen, setIsOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: parseLocalDate(ft.start_date),
    to: ft.end_date ? parseLocalDate(ft.end_date) : undefined,
  })
  const [jobId, setJobId] = useState(ft.job_id)
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [overlapInfos, setOverlapInfos] = useState<OverlapInfo[]>([])
  const [overlapNewStart, setOverlapNewStart] = useState<Date | null>(null)

  const { data: jobs = [] } = useJobListQuery()
  const { mutateAsync: ftMutate } = useHandleFieldTrainingMutation()
  const { mutateAsync: empMutate } = useHandleEmploymentMutation()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: [`user-${studentId}`] }),
    ])

  const doSave = async () => {
    await ftMutate([
      {
        action: 'update',
        datas: {
          field_training: {
            student_id: studentId,
            company_id: ft.company_id,
            job_id: jobId,
            start_date: dateRange.from
              ? toDateStr(dateRange.from)
              : ft.start_date,
            end_date: dateRange.to ? toDateStr(dateRange.to) : ft.end_date,
          },
        },
      },
    ])
    await invalidate()
    setIsOpen(false)
    toast({ title: '저장되었습니다.' })
  }

  const handleSave = async () => {
    try {
      const newStart = dateRange.from ?? new Date(ft.start_date)
      const newEnd =
        dateRange.to ?? (ft.end_date ? new Date(ft.end_date) : FAR_FUTURE)
      const overlaps = findAllOverlaps(newStart, newEnd, selfKey, allFT, allEMP)
      if (overlaps.length > 0) {
        setOverlapInfos(overlaps)
        setOverlapNewStart(newStart)
        return
      }
      await doSave()
    } catch {
      toast({ variant: 'destructive', title: '저장에 실패했습니다.' })
    }
  }

  const handleAdjustAndSave = async () => {
    if (!overlapInfos.length || !overlapNewStart) return
    const adjustedEnd = new Date(overlapNewStart)
    adjustedEnd.setDate(adjustedEnd.getDate() - 1)
    const adjustedEndStr = toDateStr(adjustedEnd)
    try {
      for (const info of overlapInfos) {
        if (info.type === 'field_training') {
          const target = allFT.find(
            (f) =>
              f.start_date === info.startDate &&
              (f.companies?.company_name ?? '') === info.companyName
          )
          if (target)
            await ftMutate([
              {
                action: 'update',
                datas: {
                  field_training: {
                    student_id: studentId,
                    company_id: target.company_id,
                    job_id: target.job_id,
                    start_date: target.start_date,
                    end_date: adjustedEndStr,
                  },
                },
              },
            ])
        } else {
          const target = allEMP.find(
            (e) =>
              e.start_date === info.startDate &&
              (e.companies?.company_name ?? '') === info.companyName
          )
          if (target)
            await empMutate([
              {
                action: 'update',
                datas: {
                  employment_companies: {
                    student_id: studentId,
                    company_id: target.company_id,
                    job_id: target.job_id,
                    start_date: target.start_date,
                    end_date: adjustedEndStr,
                    deleted_at: null,
                  },
                },
              },
            ])
        }
      }
      setOverlapInfos([])
      setOverlapNewStart(null)
      await doSave()
    } catch {
      toast({ variant: 'destructive', title: '처리에 실패했습니다.' })
    }
  }

  const handleDelete = async () => {
    try {
      await ftMutate([
        {
          action: 'delete',
          datas: {
            field_training: {
              student_id: studentId,
              company_id: ft.company_id,
              job_id: ft.job_id,
              start_date: ft.start_date,
              end_date: ft.end_date ?? '',
            },
          },
        },
      ])
      await invalidate()
      toast({ title: '삭제되었습니다.' })
    } catch {
      toast({ variant: 'destructive', title: '삭제에 실패했습니다.' })
    }
  }

  const handleEarlyEnd = async (endDate: string, deleteEmployment: boolean) => {
    try {
      await ftMutate([
        {
          action: 'update',
          datas: {
            field_training: {
              student_id: studentId,
              company_id: ft.company_id,
              job_id: ft.job_id,
              start_date: ft.start_date,
              end_date: endDate,
            },
          },
        },
      ])
      if (deleteEmployment) {
        await empMutate([
          {
            action: 'delete',
            datas: {
              employment_companies: {
                student_id: studentId,
                company_id: ft.company_id,
                job_id: ft.job_id,
                start_date: ft.start_date,
                end_date: null,
                created_at: new Date().toISOString(),
              },
            },
          },
        ])
      }
      await invalidate()
      setIsOpen(false)
      toast({ title: '조기종료 처리되었습니다.' })
    } catch {
      toast({ variant: 'destructive', title: '처리에 실패했습니다.' })
    }
  }

  const isOngoing = !ft.end_date || new Date(ft.end_date) > new Date()

  return (
    <div className='overflow-hidden rounded-md border border-l-4 border-l-green-400'>
      <button
        className='flex w-full items-center justify-between p-3 text-left'
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className='space-y-0.5'>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='text-xs'>
              현장실습
            </Badge>
            <span className='font-medium'>{ft.companies.company_name}</span>
          </div>
          <p className='text-sm text-muted-foreground'>{ft.jobs.job_name}</p>
          <p className='text-sm text-muted-foreground'>
            {formatDate(ft.start_date)} ~{' '}
            {ft.end_date ? formatDate(ft.end_date) : '현재'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {isOngoing ? (
            <div className='flex items-center gap-1.5'>
              <span className='h-2 w-2 animate-pulse rounded-full bg-green-500' />
              <span className='text-sm font-medium text-green-600'>
                진행 중
              </span>
            </div>
          ) : (
            <Badge variant='outline'>종료</Badge>
          )}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className='space-y-3 border-t bg-muted/30 p-3'>
          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>실습 기간</p>
            <div className='flex justify-center'>
              <Calendar
                mode='range'
                selected={dateRange}
                onSelect={(r) => r && setDateRange(r)}
                className='rounded-lg border border-border p-2'
              />
            </div>
          </div>
          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>실습 직무</p>
            <Select
              value={String(jobId)}
              onValueChange={(v) => setJobId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.job_id} value={String(job.job_id)}>
                    {job.job_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {ft.end_date && new Date(ft.end_date) > new Date() && (
            <Button
              variant='outline'
              className='w-full'
              onClick={() => setEndDialogOpen(true)}
            >
              실습 조기종료
            </Button>
          )}
          <div className='flex gap-2 pt-1'>
            <Button
              variant='destructive'
              size='sm'
              className='flex-1'
              onClick={handleDelete}
            >
              삭제
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='flex-1'
              onClick={() => setIsOpen(false)}
            >
              취소
            </Button>
            <Button size='sm' className='flex-1' onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>
      )}

      <FieldTrainingEndDialog
        open={endDialogOpen}
        onOpenChange={setEndDialogOpen}
        onConfirm={handleEarlyEnd}
      />
      <CareerOverlapDialog
        open={overlapInfos.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setOverlapInfos([])
            setOverlapNewStart(null)
          }
        }}
        overlaps={overlapInfos}
        adjustedEndDate={
          overlapNewStart
            ? toDateStr(new Date(overlapNewStart.getTime() - 86400000))
            : null
        }
        onSaveAnyway={async () => {
          setOverlapInfos([])
          setOverlapNewStart(null)
          try {
            await doSave()
          } catch {
            toast({ variant: 'destructive', title: '저장에 실패했습니다.' })
          }
        }}
        onAdjustAndSave={handleAdjustAndSave}
      />
    </div>
  )
}

// ─── 취업 카드 ─────────────────────────────────────────────────────────────────

function EmploymentCard({
  emp,
  studentId,
  allFT,
  allEMP,
}: {
  emp: EMP
  studentId: string
  allFT: FT[]
  allEMP: EMP[]
}) {
  const selfKey = `emp-${emp.company_id}-${emp.job_id}-${emp.start_date}`
  const [isOpen, setIsOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: parseLocalDate(emp.start_date),
    to: emp.end_date ? parseLocalDate(emp.end_date) : undefined,
  })
  const [jobId, setJobId] = useState(emp.job_id)
  const [overlapInfos, setOverlapInfos] = useState<OverlapInfo[]>([])
  const [overlapNewStart, setOverlapNewStart] = useState<Date | null>(null)
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [endReason, setEndReason] = useState('')
  const [endReasonEtc, setEndReasonEtc] = useState('')

  const { data: jobs = [] } = useJobListQuery()
  const { mutateAsync: empMutate } = useHandleEmploymentMutation()
  const { mutateAsync: ftMutate } = useHandleFieldTrainingMutation()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: [`user-${studentId}`] }),
    ])

  const doSave = async () => {
    await empMutate([
      {
        action: 'update',
        datas: {
          employment_companies: {
            student_id: studentId,
            company_id: emp.company_id,
            job_id: jobId,
            start_date: dateRange.from
              ? toDateStr(dateRange.from)
              : emp.start_date,
            end_date: dateRange.to ? toDateStr(dateRange.to) : null,
            deleted_at: null,
          },
        },
      },
    ])
    await invalidate()
    setIsOpen(false)
    toast({ title: '저장되었습니다.' })
  }

  const handleSave = async () => {
    try {
      const newStart = dateRange.from ?? new Date(emp.start_date)
      const newEnd = dateRange.to ?? FAR_FUTURE
      const overlaps = findAllOverlaps(newStart, newEnd, selfKey, allFT, allEMP)
      if (overlaps.length > 0) {
        setOverlapInfos(overlaps)
        setOverlapNewStart(newStart)
        return
      }
      await doSave()
    } catch {
      toast({ variant: 'destructive', title: '저장에 실패했습니다.' })
    }
  }

  const handleAdjustAndSave = async () => {
    if (!overlapInfos.length || !overlapNewStart) return
    const adjustedEnd = new Date(overlapNewStart)
    adjustedEnd.setDate(adjustedEnd.getDate() - 1)
    const adjustedEndStr = toDateStr(adjustedEnd)
    try {
      for (const info of overlapInfos) {
        if (info.type === 'field_training') {
          const target = allFT.find(
            (f) =>
              f.start_date === info.startDate &&
              (f.companies?.company_name ?? '') === info.companyName
          )
          if (target)
            await ftMutate([
              {
                action: 'update',
                datas: {
                  field_training: {
                    student_id: studentId,
                    company_id: target.company_id,
                    job_id: target.job_id,
                    start_date: target.start_date,
                    end_date: adjustedEndStr,
                  },
                },
              },
            ])
        } else {
          const target = allEMP.find(
            (e) =>
              e.start_date === info.startDate &&
              (e.companies?.company_name ?? '') === info.companyName
          )
          if (target)
            await empMutate([
              {
                action: 'update',
                datas: {
                  employment_companies: {
                    student_id: studentId,
                    company_id: target.company_id,
                    job_id: target.job_id,
                    start_date: target.start_date,
                    end_date: adjustedEndStr,
                    deleted_at: null,
                  },
                },
              },
            ])
        }
      }
      setOverlapInfos([])
      setOverlapNewStart(null)
      await doSave()
    } catch {
      toast({ variant: 'destructive', title: '처리에 실패했습니다.' })
    }
  }

  const handleDelete = async () => {
    try {
      await empMutate([
        {
          action: 'delete',
          datas: {
            employment_companies: {
              student_id: studentId,
              company_id: emp.company_id,
              job_id: emp.job_id,
              start_date: emp.start_date,
              end_date: emp.end_date,
              deleted_at: toDateTimeStr(new Date()),
            },
          },
        },
      ])
      await invalidate()
      toast({ title: '삭제되었습니다.' })
    } catch {
      toast({ variant: 'destructive', title: '삭제에 실패했습니다.' })
    }
  }

  const handleEnd = async () => {
    try {
      await empMutate([
        {
          action: 'update',
          datas: {
            employment_companies: {
              student_id: studentId,
              company_id: emp.company_id,
              job_id: emp.job_id,
              start_date: emp.start_date,
              end_date: toDateStr(endDate),
              deleted_at: null,
            },
          },
        },
      ])
      await invalidate()
      setEndDialogOpen(false)
      setIsOpen(false)
      toast({ title: '퇴직 처리되었습니다.' })
    } catch {
      toast({ variant: 'destructive', title: '처리에 실패했습니다.' })
    }
  }

  return (
    <div className='overflow-hidden rounded-md border border-l-4 border-l-blue-400'>
      <button
        className='flex w-full items-center justify-between p-3 text-left'
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className='space-y-0.5'>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='text-xs'>
              취업
            </Badge>
            <span className='font-medium'>{emp.companies.company_name}</span>
          </div>
          <p className='text-sm text-muted-foreground'>{emp.jobs.job_name}</p>
          <p className='text-sm text-muted-foreground'>
            {formatDate(emp.start_date)} ~{' '}
            {emp.end_date ? formatDate(emp.end_date) : '현재'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {!emp.end_date ? (
            <div className='flex items-center gap-1.5'>
              <span className='h-2 w-2 animate-pulse rounded-full bg-blue-500' />
              <span className='text-sm font-medium text-blue-600'>재직 중</span>
            </div>
          ) : (
            <Badge variant='outline'>퇴직</Badge>
          )}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className='space-y-3 border-t bg-muted/30 p-3'>
          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>입사일</p>
            <div className='flex justify-center'>
              <Calendar
                mode='single'
                selected={dateRange.from}
                onSelect={(date) =>
                  date && setDateRange({ from: date, to: undefined })
                }
                className='rounded-lg border border-border p-2'
              />
            </div>
          </div>
          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>취업 직무</p>
            <Select
              value={String(jobId)}
              onValueChange={(v) => setJobId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.job_id} value={String(job.job_id)}>
                    {job.job_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!emp.end_date && (
            <Button
              variant='outline'
              className='w-full'
              onClick={() => setEndDialogOpen(true)}
            >
              퇴직 처리
            </Button>
          )}
          {emp.end_date && (
            <p className='text-center text-xs text-muted-foreground'>
              저장하면 퇴직일이 초기화되어 재직 중으로 변경됩니다.
            </p>
          )}
          <div className='flex gap-2 pt-1'>
            <Button
              variant='destructive'
              size='sm'
              className='flex-1'
              onClick={handleDelete}
            >
              삭제
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='flex-1'
              onClick={() => setIsOpen(false)}
            >
              취소
            </Button>
            <Button size='sm' className='flex-1' onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>
      )}

      {/* 퇴직 처리 다이얼로그 */}
      <Dialog
        open={endDialogOpen}
        onOpenChange={(open) => {
          setEndDialogOpen(open)
          if (!open) {
            setEndReason('')
            setEndReasonEtc('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>퇴직 처리</DialogTitle>
            <DialogDescription>
              퇴직일을 선택하세요. 복직 시에는 카드를 열고 저장하면 재직 중으로
              되돌아옵니다.
            </DialogDescription>
          </DialogHeader>
          <div className='flex w-full flex-col gap-3'>
            <p className='text-sm font-medium'>퇴직일</p>
            <div className='flex'>
              <Calendar
                mode='single'
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                className='rounded-lg border border-border p-2'
              />
            </div>
            <p className='text-sm font-medium'>퇴직 사유</p>
            <Select value={endReason} onValueChange={setEndReason}>
              <SelectTrigger>
                <SelectValue placeholder='사유를 선택하세요' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='졸업'>졸업</SelectItem>
                <SelectItem value='계약만료'>계약 만료</SelectItem>
                <SelectItem value='자진퇴사'>자진 퇴사</SelectItem>
                <SelectItem value='권고사직'>권고 사직</SelectItem>
                <SelectItem value='기타'>기타</SelectItem>
              </SelectContent>
            </Select>
            {endReason === '기타' && (
              <Input
                placeholder='사유를 직접 입력하세요'
                value={endReasonEtc}
                onChange={(e) => setEndReasonEtc(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEndDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEnd}>퇴직 처리하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CareerOverlapDialog
        open={overlapInfos.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setOverlapInfos([])
            setOverlapNewStart(null)
          }
        }}
        overlaps={overlapInfos}
        adjustedEndDate={
          overlapNewStart
            ? toDateStr(new Date(overlapNewStart.getTime() - 86400000))
            : null
        }
        onSaveAnyway={async () => {
          setOverlapInfos([])
          setOverlapNewStart(null)
          try {
            await doSave()
          } catch {
            toast({ variant: 'destructive', title: '저장에 실패했습니다.' })
          }
        }}
        onAdjustAndSave={handleAdjustAndSave}
      />
    </div>
  )
}

// ─── 추가 폼 ───────────────────────────────────────────────────────────────────

function AddCareerCard({
  studentId,
  allFT,
  allEMP,
}: {
  studentId: string
  allFT: FT[]
  allEMP: EMP[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [careerType, setCareerType] = useState<
    'field_training' | 'employment' | null
  >(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [jobId, setJobId] = useState<number | null>(null)
  const [autoEmployment, setAutoEmployment] = useState(false)
  const [overlapInfos, setOverlapInfos] = useState<OverlapInfo[]>([])
  const [overlapNewStart, setOverlapNewStart] = useState<Date | null>(null)

  const { data: companies = [], refetch: refetchCompanies } =
    useCompanyListQuery()
  const { data: jobs = [], refetch: refetchJobs } = useJobListQuery()
  const { mutateAsync: ftMutate } = useHandleFieldTrainingMutation()
  const { mutateAsync: empMutate } = useHandleEmploymentMutation()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const reset = () => {
    setCareerType(null)
    setDateRange(undefined)
    setCompanyId(null)
    setJobId(null)
    setAutoEmployment(false)
    setOverlapInfos([])
    setOverlapNewStart(null)
    setIsOpen(false)
  }

  const doAdd = async () => {
    if (!careerType || !dateRange?.from || !companyId || !jobId) return
    try {
      if (careerType === 'field_training') {
        if (!dateRange.to) {
          toast({
            variant: 'destructive',
            title: '현장실습은 종료일이 필요합니다.',
          })
          return
        }
        await ftMutate([
          {
            action: 'add',
            datas: {
              field_training: {
                student_id: studentId,
                company_id: companyId,
                job_id: jobId,
                start_date: toDateStr(dateRange.from),
                end_date: toDateStr(dateRange.to),
                lead_or_part: false,
                created_at: toDateTimeStr(new Date()),
              },
            },
          },
        ])
        if (autoEmployment) {
          const empStart = new Date(dateRange.to)
          empStart.setDate(empStart.getDate() + 1)
          await empMutate([
            {
              action: 'add',
              datas: {
                employment_companies: {
                  student_id: studentId,
                  company_id: companyId,
                  job_id: jobId,
                  start_date: toDateStr(empStart),
                  end_date: null,
                  created_at: toDateTimeStr(new Date()),
                },
              },
            },
          ])
        }
      } else {
        await empMutate([
          {
            action: 'add',
            datas: {
              employment_companies: {
                student_id: studentId,
                company_id: companyId,
                job_id: jobId,
                start_date: toDateStr(dateRange.from),
                end_date: dateRange.to ? toDateStr(dateRange.to) : null,
                created_at: toDateTimeStr(new Date()),
              },
            },
          },
        ])
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: [`user-${studentId}`] }),
      ])
      toast({ title: '추가되었습니다.' })
      reset()
    } catch {
      toast({ variant: 'destructive', title: '추가에 실패했습니다.' })
    }
  }

  const handleAdd = () => {
    if (!careerType || !dateRange?.from || !companyId || !jobId) {
      toast({ variant: 'destructive', title: '누락된 정보가 있습니다.' })
      return
    }
    try {
      const newEnd = dateRange.to ?? FAR_FUTURE
      const overlaps = findAllOverlaps(
        dateRange.from,
        newEnd,
        '',
        allFT,
        allEMP
      )
      if (overlaps.length > 0) {
        setOverlapInfos(overlaps)
        setOverlapNewStart(dateRange.from)
        return
      }
      doAdd()
    } catch {
      toast({
        variant: 'destructive',
        title: '겹침 확인 중 오류가 발생했습니다.',
      })
    }
  }

  if (!isOpen) {
    return (
      <button
        className='flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary'
        onClick={() => setIsOpen(true)}
      >
        <Plus size={14} />
        경력 추가
      </button>
    )
  }

  return (
    <div className='space-y-3 rounded-md border p-3'>
      <p className='font-medium'>경력 추가</p>

      {/* 타입 선택 */}
      <div className='grid grid-cols-2 gap-2'>
        <button
          onClick={() => setCareerType('field_training')}
          className={cn(
            'rounded-md border p-2 text-sm font-medium transition-colors',
            careerType === 'field_training'
              ? 'border-green-400 bg-green-50 text-green-700 dark:bg-green-950'
              : 'hover:border-green-300 hover:text-green-600'
          )}
        >
          현장실습
        </button>
        <button
          onClick={() => setCareerType('employment')}
          className={cn(
            'rounded-md border p-2 text-sm font-medium transition-colors',
            careerType === 'employment'
              ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950'
              : 'hover:border-blue-300 hover:text-blue-600'
          )}
        >
          취업
        </button>
      </div>

      {careerType && (
        <>
          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>
              {careerType === 'employment' ? '입사일' : '실습 기간'}
            </p>
            <div className='flex justify-center'>
              {careerType === 'employment' ? (
                <Calendar
                  mode='single'
                  selected={dateRange?.from}
                  onSelect={(date) =>
                    date && setDateRange({ from: date, to: undefined })
                  }
                  className='rounded-lg border border-border p-2'
                />
              ) : (
                <Calendar
                  mode='range'
                  selected={dateRange}
                  onSelect={setDateRange}
                  className='rounded-lg border border-border p-2'
                />
              )}
            </div>
          </div>

          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>직무</p>
            <Select onValueChange={(v) => setJobId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder='직무 선택' />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.job_id} value={String(job.job_id)}>
                    {job.job_name}
                  </SelectItem>
                ))}
                <AddFieldTrainingOption type='job' onSuccess={refetchJobs} />
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>회사명</p>
            <Select onValueChange={(v) => setCompanyId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder='회사 선택' />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.company_id} value={String(c.company_id)}>
                    {c.company_name}
                  </SelectItem>
                ))}
                <AddFieldTrainingOption
                  type='company'
                  onSuccess={refetchCompanies}
                />
              </SelectContent>
            </Select>
          </div>

          {careerType === 'field_training' && (
            <div className='flex items-center justify-between rounded-md border p-3'>
              <div>
                <p className='text-sm font-medium'>취업으로 이어지기</p>
                <p className='text-xs text-muted-foreground'>
                  현장실습 종료 다음날부터 같은 회사·직무로 취업 이력을 자동
                  등록합니다.
                </p>
              </div>
              <Switch
                checked={autoEmployment}
                onCheckedChange={setAutoEmployment}
                id='auto-emp'
              />
            </div>
          )}
        </>
      )}

      <div className='flex gap-2 pt-1'>
        <Button variant='outline' size='sm' className='flex-1' onClick={reset}>
          취소
        </Button>
        <Button
          size='sm'
          className='flex-1'
          onClick={handleAdd}
          disabled={!careerType}
        >
          추가
        </Button>
      </div>

      <CareerOverlapDialog
        open={overlapInfos.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setOverlapInfos([])
            setOverlapNewStart(null)
          }
        }}
        overlaps={overlapInfos}
        adjustedEndDate={
          overlapNewStart
            ? toDateStr(new Date(overlapNewStart.getTime() - 86400000))
            : null
        }
        onSaveAnyway={() => {
          setOverlapInfos([])
          setOverlapNewStart(null)
          doAdd()
        }}
        onAdjustAndSave={async () => {
          if (!overlapInfos.length || !overlapNewStart) return
          const adjustedEnd = new Date(overlapNewStart)
          adjustedEnd.setDate(adjustedEnd.getDate() - 1)
          const adjustedEndStr = toDateStr(adjustedEnd)
          try {
            for (const info of overlapInfos) {
              if (info.type === 'field_training') {
                const target = allFT.find(
                  (f) =>
                    f.start_date === info.startDate &&
                    (f.companies?.company_name ?? '') === info.companyName
                )
                if (target)
                  await ftMutate([
                    {
                      action: 'update',
                      datas: {
                        field_training: {
                          student_id: studentId,
                          company_id: target.company_id,
                          job_id: target.job_id,
                          start_date: target.start_date,
                          end_date: adjustedEndStr,
                        },
                      },
                    },
                  ])
              } else {
                const target = allEMP.find(
                  (e) =>
                    e.start_date === info.startDate &&
                    (e.companies?.company_name ?? '') === info.companyName
                )
                if (target)
                  await empMutate([
                    {
                      action: 'update',
                      datas: {
                        employment_companies: {
                          student_id: studentId,
                          company_id: target.company_id,
                          job_id: target.job_id,
                          start_date: target.start_date,
                          end_date: adjustedEndStr,
                          deleted_at: null,
                        },
                      },
                    },
                  ])
              }
            }
            setOverlapInfos([])
            setOverlapNewStart(null)
            await doAdd()
          } catch {
            toast({ variant: 'destructive', title: '처리에 실패했습니다.' })
          }
        }}
      />
    </div>
  )
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export const Career = ({
  fieldTraining,
  employment,
}: {
  fieldTraining: UserDetailType['field_training']
  employment: UserDetailType['employment_companies']
}) => {
  const { currentRow } = useUsers()
  const studentId = currentRow?.student_id ?? ''

  // 날짜순 통합 정렬
  const items: CareerItem[] = [
    ...fieldTraining
      .filter((ft) => !ft.deleted_at)
      .map(
        (ft): CareerItem => ({
          type: 'field_training',
          data: ft,
          startDate: new Date(ft.start_date),
        })
      ),
    ...employment
      .filter((e) => !e.deleted_at)
      .map(
        (e): CareerItem => ({
          type: 'employment',
          data: e,
          startDate: new Date(e.start_date),
        })
      ),
  ].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  const ongoingEnd = (startDate: string) => {
    const start = parseLocalDate(startDate)
    const base = new Date(Math.max(start.getTime(), new Date().getTime()))
    return new Date(base.getTime() + 90 * 24 * 60 * 60 * 1000)
  }

  const ftRanges = fieldTraining
    .filter((ft) => !ft.deleted_at && ft.start_date)
    .map((ft) => ({
      from: parseLocalDate(ft.start_date!),
      to: ft.end_date
        ? parseLocalDate(ft.end_date)
        : ongoingEnd(ft.start_date!),
    }))

  const empRanges = employment
    .filter((e) => !e.deleted_at && e.start_date)
    .map((e) => ({
      from: parseLocalDate(e.start_date!),
      to: e.end_date ? parseLocalDate(e.end_date) : ongoingEnd(e.start_date!),
    }))

  const hasCalendarData = ftRanges.length > 0 || empRanges.length > 0

  return (
    <div className='space-y-5'>
      {/* 캘린더 */}
      {hasCalendarData && (
        <div>
          <div className='mb-3 flex gap-4 text-sm'>
            <span className='flex items-center gap-1.5'>
              <span className='inline-block h-3 w-3 rounded-sm bg-green-300' />
              현장실습
            </span>
            <span className='flex items-center gap-1.5'>
              <span className='inline-block h-3 w-3 rounded-sm bg-blue-300' />
              취업
            </span>
          </div>
          <DayPicker
            locale={ko}
            defaultMonth={new Date()}
            numberOfMonths={1}
            showOutsideDays
            modifiers={{
              fieldTraining: (date) => isInRanges(date, ftRanges),
              employment: (date) => isInRanges(date, empRanges),
            }}
            modifiersStyles={{
              fieldTraining: {
                backgroundColor: 'rgb(134 239 172 / 0.6)',
                borderRadius: 0,
              },
              employment: {
                backgroundColor: 'rgb(147 197 253 / 0.6)',
                borderRadius: 0,
              },
            }}
            components={{
              IconLeft: () => <ChevronLeft className='h-4 w-4' />,
              IconRight: () => <ChevronRight className='h-4 w-4' />,
            }}
            classNames={{
              months:
                'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4 w-full',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium',
              nav: 'space-x-1 flex items-center',
              nav_button: cn(
                buttonVariants({ variant: 'outline' }),
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
              ),
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex justify-around',
              head_cell:
                'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'relative flex-1 p-0 text-center text-sm focus-within:relative focus-within:z-20',
              day: cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full h-8 p-0 font-normal pointer-events-none'
              ),
              day_today: 'bg-accent text-accent-foreground',
              day_outside: 'text-muted-foreground opacity-50',
              day_hidden: 'invisible',
            }}
          />
        </div>
      )}

      {/* 통합 경력 목록 */}
      <div className='space-y-2'>
        {items.length === 0 ? (
          <p className='text-sm text-muted-foreground'>경력 정보가 없습니다.</p>
        ) : (
          items.map((item) =>
            item.type === 'field_training' ? (
              <FieldTrainingCard
                key={`ft-${item.data.company_id}-${item.data.job_id}-${item.data.start_date}`}
                ft={item.data}
                studentId={studentId}
                allFT={fieldTraining.filter((f) => !f.deleted_at)}
                allEMP={employment.filter((e) => !e.deleted_at)}
              />
            ) : (
              <EmploymentCard
                key={`emp-${item.data.company_id}-${item.data.job_id}-${item.data.start_date}`}
                emp={item.data}
                studentId={studentId}
                allFT={fieldTraining.filter((f) => !f.deleted_at)}
                allEMP={employment.filter((e) => !e.deleted_at)}
              />
            )
          )
        )}
        <AddCareerCard
          studentId={studentId}
          allFT={fieldTraining.filter((f) => !f.deleted_at)}
          allEMP={employment.filter((e) => !e.deleted_at)}
        />
      </div>
    </div>
  )
}
