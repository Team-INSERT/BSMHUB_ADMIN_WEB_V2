import { ArrowRight } from 'lucide-react'
import { formatDate } from '@/utils/formatDate'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type OverlapInfo = {
  type: 'field_training' | 'employment'
  companyName: string
  startDate: string
  endDate: string | null
}

export function CareerOverlapDialog({
  open,
  onOpenChange,
  overlaps,
  adjustedEndDate,
  onSaveAnyway,
  onAdjustAndSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  overlaps: OverlapInfo[]
  adjustedEndDate: string | null
  onSaveAnyway: () => void
  onAdjustAndSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>날짜가 겹칩니다</DialogTitle>
          <DialogDescription>
            {overlaps.length === 1
              ? '아래 항목과 날짜가 겹칩니다. 어떻게 처리할까요?'
              : `아래 ${overlaps.length}개 항목과 날짜가 겹칩니다. 어떻게 처리할까요?`}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-2'>
          {overlaps.map((overlap, i) => {
            const typeName = overlap.type === 'field_training' ? '현장실습' : '취업'
            const currentPeriod = `${formatDate(overlap.startDate)} ~ ${overlap.endDate ? formatDate(overlap.endDate) : '현재'}`
            const newPeriod = adjustedEndDate
              ? `${formatDate(overlap.startDate)} ~ ${adjustedEndDate}`
              : null

            return (
              <div key={i} className='rounded-md border p-3 text-sm'>
                <p className='mb-1.5 font-medium'>
                  {typeName} · {overlap.companyName}
                </p>
                {newPeriod ? (
                  <div className='flex flex-wrap items-center gap-1.5 text-muted-foreground'>
                    <span className='line-through'>{currentPeriod}</span>
                    <ArrowRight size={13} className='flex-shrink-0 text-primary' />
                    <span className='font-medium text-foreground'>{newPeriod}</span>
                  </div>
                ) : (
                  <p className='text-muted-foreground'>{currentPeriod}</p>
                )}
              </div>
            )
          })}
        </div>

        {adjustedEndDate && (
          <p className='text-sm text-muted-foreground'>
            <span className='font-medium text-foreground'>자동 조정</span>을 선택하면
            겹치는 항목의 종료일이{' '}
            <span className='font-medium text-foreground'>{adjustedEndDate}</span>로
            일괄 조정됩니다.
          </p>
        )}

        <DialogFooter className='flex-col gap-2 sm:flex-row'>
          <Button variant='outline' className='flex-1' onClick={() => onOpenChange(false)}>
            돌아가기
          </Button>
          <Button variant='secondary' className='flex-1' onClick={onSaveAnyway}>
            겹친 채로 저장
          </Button>
          <Button className='flex-1' onClick={onAdjustAndSave}>
            겹치는 항목 조정 후 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
