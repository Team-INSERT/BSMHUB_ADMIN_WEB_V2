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
import { useHandleMilitaryServiceMutation } from '../services/military-services/handleMilitaryService'
import { useMilitaryServiceStatusListQuery } from '../services/military-services/selectMilitaryServiceStatuses'
import { MS } from './career-types'
import { toDateStr, parseLocalDate } from './career-utils'

export function MilitaryServiceCard({
  ms,
  studentId,
}: {
  ms: MS
  studentId: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: parseLocalDate(ms.start_date),
    to: parseLocalDate(ms.end_date),
  })
  const [statusId, setStatusId] = useState(ms.military_service_status_id)

  const { data: statuses = [] } = useMilitaryServiceStatusListQuery()
  const { mutateAsync: msMutate } = useHandleMilitaryServiceMutation()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: [`user-${studentId}`] }),
    ])

  const today = new Date()
  const startDate = parseLocalDate(ms.start_date)
  const endDate = parseLocalDate(ms.end_date)
  const isOngoing = startDate <= today && today <= endDate

  const handleSave = async () => {
    try {
      await msMutate([
        {
          action: 'update',
          datas: {
            military_service: {
              student_id: studentId,
              start_date: dateRange.from
                ? toDateStr(dateRange.from)
                : ms.start_date,
              end_date: dateRange.to ? toDateStr(dateRange.to) : ms.end_date,
              military_service_status_id: statusId,
              original_start_date: ms.start_date,
            },
          },
        },
      ])
      await invalidate()
      setIsOpen(false)
      toast({ title: '저장되었습니다.' })
    } catch {
      toast({ variant: 'destructive', title: '저장에 실패했습니다.' })
    }
  }

  const handleDelete = async () => {
    try {
      await msMutate([
        {
          action: 'delete',
          datas: {
            military_service: {
              student_id: studentId,
              start_date: ms.start_date,
              end_date: ms.end_date,
              military_service_status_id: ms.military_service_status_id,
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

  return (
    <div className='overflow-hidden rounded-md border border-l-4 border-l-purple-400'>
      <button
        className='flex w-full items-center justify-between p-3 text-left'
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className='space-y-0.5'>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='text-xs'>
              군대
            </Badge>
            <span className='font-medium'>
              {ms.military_service_statuses.military_service_status_name}
            </span>
          </div>
          <p className='text-sm text-muted-foreground'>
            {formatDate(ms.start_date)} ~ {formatDate(ms.end_date)}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {isOngoing ? (
            <div className='flex items-center gap-1.5'>
              <span className='h-2 w-2 animate-pulse rounded-full bg-purple-500' />
              <span className='text-sm font-medium text-purple-600'>
                복무 중
              </span>
            </div>
          ) : (
            <Badge variant='outline'>전역</Badge>
          )}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className='space-y-3 border-t bg-muted/30 p-3'>
          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>복무 기간</p>
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
            <p className='text-sm font-medium'>복무 구분</p>
            <Select
              value={String(statusId)}
              onValueChange={(v) => setStatusId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
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
    </div>
  )
}
