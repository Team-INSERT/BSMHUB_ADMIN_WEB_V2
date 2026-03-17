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
import { OverlapTarget } from './career-types'
import { toDateStr } from './career-utils'

export function OverlapConfirmDialog({
  overlaps,
  onConfirm,
  onCancel,
}: {
  overlaps: OverlapTarget[]
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>기간 겹침 확인</DialogTitle>
          <DialogDescription>
            저장하면 아래 항목이 자동으로 조정됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          {overlaps.map((o, i) => {
            const name = o.target.companies?.company_name
            const startDate = o.target.start_date
            const endDate = o.target.end_date
            const adj = o.adjustment
            return (
              <div key={i} className='rounded-md border p-3 text-sm'>
                <p className='font-medium'>{name}</p>
                <p className='text-muted-foreground'>
                  {formatDate(startDate)} ~{' '}
                  {endDate ? formatDate(endDate) : '현재'}
                </p>
                {adj.kind === 'trim-end' && (
                  <p className='mt-1 text-xs text-orange-600'>
                    → 종료일이 {formatDate(toDateStr(adj.newEnd))}로 조정됩니다.
                  </p>
                )}
                {adj.kind === 'push-start' && (
                  <p className='mt-1 text-xs text-orange-600'>
                    → 시작일이 {formatDate(toDateStr(adj.newStart))}로 조정됩니다.
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onCancel}>
            취소
          </Button>
          <Button onClick={onConfirm}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
