import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCompanyListQuery } from '@/features/companies/services/selectCompanyList'
import { useHandleEmploymentMutation } from '../services/employment-companies/handleEmployment'
import { useHandleFieldTrainingMutation } from '../services/field-training/handleFieldTraining'
import { useJobListQuery } from '../services/field-training/selectJobList'
import { useHandleMilitaryServiceMutation } from '../services/military-services/handleMilitaryService'
import { useMilitaryServiceStatusListQuery } from '../services/military-services/selectMilitaryServiceStatuses'
import { useHandleStudentUniversityMutation } from '../services/student-universities/handleStudentUniversity'
import { useUniversityListQuery } from '../services/student-universities/selectUniversityList'
import { AddFieldTrainingOption } from './add-field-training-option'
import { AddUniversityOption } from './add-university-option'
import { checkOverlaps } from './career-overlap'
import { OverlapConfirmDialog } from './career-overlap-confirm-dialog'
import { FT, EMP, MS, OverlapTarget, FAR_FUTURE } from './career-types'
import { toDateStr, toDateTimeStr } from './career-utils'

export function AddCareerCard({
  studentId,
  allFT,
  allEMP,
  militaryServices: _militaryServices = [],
}: {
  studentId: string
  allFT: FT[]
  allEMP: EMP[]
  militaryServices?: MS[]
}) {
  const NO_DEPARTMENT_VALUE = '__no_department__'
  const [isOpen, setIsOpen] = useState(false)
  const [careerType, setCareerType] = useState<
    'field_training' | 'employment' | 'military_service' | 'university' | null
  >(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [jobId, setJobId] = useState<number | null>(null)
  const [autoEmployment, setAutoEmployment] = useState(false)
  const [pendingOverlaps, setPendingOverlaps] = useState<
    OverlapTarget[] | null
  >(null)
  const [msStatusId, setMsStatusId] = useState<number | null>(null)
  const [msServiceStatus, setMsServiceStatus] = useState<
    'active' | 'completed' | null
  >(null)
  const [selectedUnivName, setSelectedUnivName] = useState<string | null>(null)
  const [univId, setUnivId] = useState<number | null>(null)

  const { data: companies = [], refetch: refetchCompanies } =
    useCompanyListQuery()
  const { data: jobs = [], refetch: refetchJobs } = useJobListQuery()
  const { data: msStatuses = [] } = useMilitaryServiceStatusListQuery()
  const { data: universities = [], refetch: refetchUniversities } =
    useUniversityListQuery()
  const { mutateAsync: ftMutate } = useHandleFieldTrainingMutation()
  const { mutateAsync: empMutate } = useHandleEmploymentMutation()
  const { mutateAsync: msMutate } = useHandleMilitaryServiceMutation()
  const { mutateAsync: univMutate } = useHandleStudentUniversityMutation()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const reset = () => {
    setCareerType(null)
    setDateRange(undefined)
    setCompanyId(null)
    setJobId(null)
    setAutoEmployment(false)
    setPendingOverlaps(null)
    setMsStatusId(null)
    setMsServiceStatus(null)
    setSelectedUnivName(null)
    setUnivId(null)
    setIsOpen(false)
  }

  const doAdd = async () => {
    if (!careerType) return

    // Handle university separately (no date range, no company/job)
    if (careerType === 'university') {
      if (!selectedUnivName) {
        toast({ variant: 'destructive', title: '대학교를 선택해주세요.' })
        return
      }
      try {
        await univMutate([
          {
            action: 'add',
            datas: {
              student_university: {
                student_id: studentId,
                ...(univId
                  ? { university_id: univId }
                  : {
                      university_name: selectedUnivName,
                      university_department: null,
                    }),
              },
            },
          },
        ])
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['users'] }),
          queryClient.invalidateQueries({ queryKey: [`user-${studentId}`] }),
        ])
        toast({ title: '추가되었습니다.' })
        reset()
      } catch (err) {
        toast({
          variant: 'destructive',
          title: '추가에 실패했습니다.',
          description: err instanceof Error ? err.message : undefined,
        })
      }
      return
    }

    // Handle military service
    if (careerType === 'military_service') {
      if (!msStatusId) {
        toast({ variant: 'destructive', title: '복무 구분을 선택해주세요.' })
        return
      }
      if (!msServiceStatus) {
        toast({ variant: 'destructive', title: '복무 상태를 선택해주세요.' })
        return
      }
      const today = toDateStr(new Date())
      try {
        await msMutate([
          {
            action: 'add',
            datas: {
              military_service: {
                student_id: studentId,
                start_date: today,
                end_date: msServiceStatus === 'active' ? null : today,
                military_service_status_id: msStatusId,
              },
            },
          },
        ])
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['users'] }),
          queryClient.invalidateQueries({ queryKey: [`user-${studentId}`] }),
        ])
        toast({ title: '추가되었습니다.' })
        reset()
      } catch {
        toast({ variant: 'destructive', title: '추가에 실패했습니다.' })
      }
      return
    }

    if (!dateRange?.from || !companyId || !jobId) return
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

  const applyOverlapsAndAdd = async (overlaps: OverlapTarget[]) => {
    try {
      for (const overlap of overlaps) {
        const adj = overlap.adjustment
        if (overlap.type === 'field_training') {
          const t = overlap.target
          if (adj.kind === 'trim-end') {
            await ftMutate([
              {
                action: 'update',
                datas: {
                  field_training: {
                    student_id: studentId,
                    company_id: t.company_id,
                    job_id: t.job_id,
                    start_date: t.start_date,
                    end_date: toDateStr(adj.newEnd),
                  },
                },
              },
            ])
          } else if (adj.kind === 'push-start') {
            await ftMutate([
              {
                action: 'delete',
                datas: {
                  field_training: {
                    student_id: studentId,
                    company_id: t.company_id,
                    job_id: t.job_id,
                    start_date: t.start_date,
                    end_date: t.end_date ?? '',
                  },
                },
              },
            ])
            await ftMutate([
              {
                action: 'add',
                datas: {
                  field_training: {
                    student_id: studentId,
                    company_id: t.company_id,
                    job_id: t.job_id,
                    start_date: toDateStr(adj.newStart),
                    end_date: t.end_date,
                    lead_or_part: t.lead_or_part,
                    created_at: toDateTimeStr(new Date()),
                  },
                },
              },
            ])
          }
        } else {
          const t = overlap.target
          if (adj.kind === 'trim-end') {
            await empMutate([
              {
                action: 'update',
                datas: {
                  employment_companies: {
                    student_id: studentId,
                    company_id: t.company_id,
                    job_id: t.job_id,
                    original_start_date: t.start_date,
                    start_date: t.start_date,
                    end_date: toDateStr(adj.newEnd),
                  },
                },
              },
            ])
          } else if (adj.kind === 'push-start') {
            await empMutate([
              {
                action: 'update',
                datas: {
                  employment_companies: {
                    student_id: studentId,
                    company_id: t.company_id,
                    job_id: t.job_id,
                    original_start_date: t.start_date,
                    start_date: toDateStr(adj.newStart),
                    end_date: t.end_date,
                  },
                },
              },
            ])
          }
        }
      }
      setPendingOverlaps(null)
      await doAdd()
    } catch {
      toast({ variant: 'destructive', title: '추가에 실패했습니다.' })
    }
  }

  const handleAdd = () => {
    // university and military_service skip date/overlap validation
    if (careerType === 'university') {
      doAdd()
      return
    }
    if (careerType === 'military_service') {
      doAdd()
      return
    }
    if (!careerType || !dateRange?.from || !companyId || !jobId) {
      toast({ variant: 'destructive', title: '누락된 정보가 있습니다.' })
      return
    }
    const newEnd = dateRange.to ?? FAR_FUTURE
    const overlaps = checkOverlaps(dateRange.from, newEnd, '', allFT, allEMP)
    if (overlaps.some((o) => o.adjustment.kind === 'block')) {
      toast({
        variant: 'destructive',
        title: '기존 기간을 완전히 덮어버려 저장할 수 없습니다.',
      })
      return
    }
    if (overlaps.length > 0) {
      setPendingOverlaps(overlaps)
      return
    }
    doAdd()
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
        <button
          onClick={() => setCareerType('military_service')}
          className={cn(
            'rounded-md border p-2 text-sm font-medium transition-colors',
            careerType === 'military_service'
              ? 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950'
              : 'hover:border-purple-300 hover:text-purple-600'
          )}
        >
          군대
        </button>
        <button
          onClick={() => setCareerType('university')}
          className={cn(
            'rounded-md border p-2 text-sm font-medium transition-colors',
            careerType === 'university'
              ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950'
              : 'hover:border-orange-300 hover:text-orange-600'
          )}
        >
          대학교
        </button>
      </div>

      {careerType === 'military_service' && (
        <>
          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>복무 구분</p>
            <Select onValueChange={(v) => setMsStatusId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder='복무 구분 선택' />
              </SelectTrigger>
              <SelectContent>
                {msStatuses.map((s) => (
                  <SelectItem
                    key={s.military_service_status_id}
                    value={String(s.military_service_status_id)}
                  >
                    {s.military_service_status_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>복무 상태</p>
            <Select
              onValueChange={(v) =>
                setMsServiceStatus(v as 'active' | 'completed')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='복무 상태 선택' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='active'>군입대</SelectItem>
                <SelectItem value='completed'>군복무 완료</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {careerType === 'university' &&
        (() => {
          const uniqueNames = [
            ...new Set(universities.map((u) => u.university_name)),
          ]
          const filteredDepts = universities.filter(
            (u) => u.university_name === selectedUnivName
          )
          return (
            <>
              <div className='space-y-1.5'>
                <p className='text-sm font-medium'>대학교명</p>
                <Select
                  value={selectedUnivName ?? ''}
                  onValueChange={(v) => {
                    setSelectedUnivName(v)
                    setUnivId(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='대학교 선택' />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                    <AddUniversityOption
                      onSuccess={async (newUniv) => {
                        await refetchUniversities()
                        setSelectedUnivName(newUniv.university_name)
                        setUnivId(newUniv.university_id)
                      }}
                    />
                  </SelectContent>
                </Select>
              </div>

              {selectedUnivName && (
                <div className='space-y-1.5'>
                  <p className='text-sm font-medium'>학과명 (선택)</p>
                  <Select
                    value={univId ? String(univId) : NO_DEPARTMENT_VALUE}
                    onValueChange={(v) =>
                      setUnivId(v === NO_DEPARTMENT_VALUE ? null : Number(v))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='학과 선택 (선택)' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_DEPARTMENT_VALUE}>
                        선택 안 함
                      </SelectItem>
                      {filteredDepts.map((u) => (
                        <SelectItem
                          key={u.university_id}
                          value={String(u.university_id)}
                        >
                          {u.university_department ?? '학과 없음'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )
        })()}

      {(careerType === 'field_training' || careerType === 'employment') && (
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
            <div className='flex flex-col rounded-md border p-3'>
              <p className='text-sm font-medium'>취업으로 이어지기</p>
              <div className='flex flex-row gap-2'>
                <p className='text-xs text-muted-foreground'>
                  현장실습 종료 다음날부터 같은 회사·직무로 취업 이력을 자동
                  등록합니다.
                </p>
                <Switch
                  checked={autoEmployment}
                  onCheckedChange={setAutoEmployment}
                  id='auto-emp'
                />
              </div>
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

      {pendingOverlaps && (
        <OverlapConfirmDialog
          overlaps={pendingOverlaps}
          onConfirm={() => applyOverlapsAndAdd(pendingOverlaps)}
          onCancel={() => setPendingOverlaps(null)}
        />
      )}
    </div>
  )
}
