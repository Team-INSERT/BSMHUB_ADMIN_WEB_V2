import { ko } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { useUsers } from '../context/users-context'
import { UserDetailType } from '../data/schema'
import { CareerItem } from './career-types'
import { parseLocalDate, isInRanges } from './career-utils'
import { FieldTrainingCard } from './field-training-card'
import { EmploymentCard } from './employment-card'
import { AddCareerCard } from './add-career-card'

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
