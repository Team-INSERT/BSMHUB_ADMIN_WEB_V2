import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { formatDate } from '@/utils/formatDate'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
import { useHandleEmploymentMutation } from '../services/employment-companies/handleEmployment'
import { useHandleFieldTrainingMutation } from '../services/field-training/handleFieldTraining'
import { useJobListQuery } from '../services/field-training/selectJobList'
import { ReasonSelect } from './reason-select'
import { FT, EMP, OverlapTarget, FAR_FUTURE, RESIGNATION_REASONS } from './career-types'
import { toDateStr, toDateTimeStr, parseLocalDate } from './career-utils'
import { checkOverlaps } from './career-overlap'
import { OverlapConfirmDialog } from './career-overlap-confirm-dialog'

export function EmploymentCard({
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
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [pendingOverlaps, setPendingOverlaps] = useState<OverlapTarget[] | null>(null)
  const [endDate, setEndDate] = useState<Date>(() => {
    const start = parseLocalDate(emp.start_date)
    return new Date() >= start ? new Date() : start
  })
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
            original_start_date: emp.start_date,
            start_date: dateRange.from
              ? toDateStr(dateRange.from)
              : emp.start_date,
            end_date: dateRange.to ? toDateStr(dateRange.to) : null,
          },
        },
      },
    ])
    await invalidate()
    setIsOpen(false)
    toast({ title: '저장되었습니다.' })
  }

  const applyOverlapsAndSave = async (overlaps: OverlapTarget[]) => {
    try {
      for (const overlap of overlaps) {
        const adj = overlap.adjustment
        if (overlap.type === 'field_training') {
          const t = overlap.target
          if (adj.kind === 'trim-end') {
            await ftMutate([{ action: 'update', datas: { field_training: { student_id: studentId, company_id: t.company_id, job_id: t.job_id, start_date: t.start_date, end_date: toDateStr(adj.newEnd) } } }])
          } else if (adj.kind === 'push-start') {
            await ftMutate([{ action: 'delete', datas: { field_training: { student_id: studentId, company_id: t.company_id, job_id: t.job_id, start_date: t.start_date, end_date: t.end_date ?? '' } } }])
            await ftMutate([{ action: 'add', datas: { field_training: { student_id: studentId, company_id: t.company_id, job_id: t.job_id, start_date: toDateStr(adj.newStart), end_date: t.end_date, lead_or_part: t.lead_or_part, created_at: toDateTimeStr(new Date()) } } }])
          }
        } else {
          const t = overlap.target
          if (adj.kind === 'trim-end') {
            await empMutate([{ action: 'update', datas: { employment_companies: { student_id: studentId, company_id: t.company_id, job_id: t.job_id, original_start_date: t.start_date, start_date: t.start_date, end_date: toDateStr(adj.newEnd) } } }])
          } else if (adj.kind === 'push-start') {
            await empMutate([{ action: 'update', datas: { employment_companies: { student_id: studentId, company_id: t.company_id, job_id: t.job_id, original_start_date: t.start_date, start_date: toDateStr(adj.newStart), end_date: t.end_date } } }])
          }
        }
      }
      setPendingOverlaps(null)
      await doSave()
    } catch {
      toast({ variant: 'destructive', title: '저장에 실패했습니다.' })
    }
  }

  const handleSave = async () => {
    try {
      const newStart = dateRange.from ?? parseLocalDate(emp.start_date)
      const newEnd = dateRange.to ?? FAR_FUTURE
      const overlaps = checkOverlaps(newStart, newEnd, selfKey, allFT, allEMP)
      if (overlaps.some((o) => o.adjustment.kind === 'block')) {
        toast({ variant: 'destructive', title: '기존 기간을 완전히 덮어버려 저장할 수 없습니다.' })
        return
      }
      if (overlaps.length > 0) {
        setPendingOverlaps(overlaps)
        return
      }
      await doSave()
    } catch {
      toast({ variant: 'destructive', title: '저장에 실패했습니다.' })
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
              original_start_date: emp.start_date,
              start_date: emp.start_date,
              end_date: toDateStr(endDate),
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
                disabled={{ before: parseLocalDate(emp.start_date) }}
                className='rounded-lg border border-border p-2'
              />
            </div>
            <ReasonSelect
              label='퇴직 사유'
              options={RESIGNATION_REASONS}
              value={endReason}
              onChange={setEndReason}
              etcValue={endReasonEtc}
              onEtcChange={setEndReasonEtc}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEndDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEnd}>퇴직 처리하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pendingOverlaps && (
        <OverlapConfirmDialog
          overlaps={pendingOverlaps}
          onConfirm={() => applyOverlapsAndSave(pendingOverlaps)}
          onCancel={() => setPendingOverlaps(null)}
        />
      )}
    </div>
  )
}
