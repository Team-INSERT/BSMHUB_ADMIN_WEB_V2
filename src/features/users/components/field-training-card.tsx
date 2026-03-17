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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useHandleEmploymentMutation } from '../services/employment-companies/handleEmployment'
import { useHandleFieldTrainingMutation } from '../services/field-training/handleFieldTraining'
import { useJobListQuery } from '../services/field-training/selectJobList'
import FieldTrainingEndDialog from './field-training-end-dialog'
import { FT, EMP, OverlapTarget, FAR_FUTURE } from './career-types'
import { toDateStr, toDateTimeStr, parseLocalDate } from './career-utils'
import { checkOverlaps } from './career-overlap'
import { OverlapConfirmDialog } from './career-overlap-confirm-dialog'

export function FieldTrainingCard({
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
  const [pendingOverlaps, setPendingOverlaps] = useState<OverlapTarget[] | null>(null)

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
      const newStart = dateRange.from ?? parseLocalDate(ft.start_date)
      const newEnd = dateRange.to ?? (ft.end_date ? parseLocalDate(ft.end_date) : FAR_FUTURE)
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

  const handleEarlyEnd = async (endDate: string, convertToEmployment: boolean) => {
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

      const linkedEmp = allEMP.find(
        (e) => e.company_id === ft.company_id && e.job_id === ft.job_id
      )

      if (convertToEmployment) {
        const newEmpStart = new Date(endDate)
        newEmpStart.setDate(newEmpStart.getDate() + 1)
        const newEmpStartStr = toDateStr(newEmpStart)
        if (linkedEmp) {
          await empMutate([
            {
              action: 'delete',
              datas: {
                employment_companies: {
                  student_id: studentId,
                  company_id: linkedEmp.company_id,
                  job_id: linkedEmp.job_id,
                  start_date: linkedEmp.start_date,
                  end_date: linkedEmp.end_date,
                  deleted_at: toDateTimeStr(new Date()),
                },
              },
            },
          ])
        }
        await empMutate([
          {
            action: 'add',
            datas: {
              employment_companies: {
                student_id: studentId,
                company_id: ft.company_id,
                job_id: ft.job_id,
                start_date: newEmpStartStr,
                end_date: null,
                created_at: toDateTimeStr(new Date()),
              },
            },
          },
        ])
      } else if (linkedEmp) {
        await empMutate([
          {
            action: 'delete',
            datas: {
              employment_companies: {
                student_id: studentId,
                company_id: linkedEmp.company_id,
                job_id: linkedEmp.job_id,
                start_date: linkedEmp.start_date,
                end_date: linkedEmp.end_date,
                deleted_at: toDateTimeStr(new Date()),
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
        startDate={parseLocalDate(ft.start_date)}
      />
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
