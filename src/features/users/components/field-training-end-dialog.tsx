import { useState } from 'react'
import { DialogTitle } from '@radix-ui/react-dialog'
import { formatDate } from '@/utils/formatDate'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog'

export default function FieldTrainingEndDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (endDate: string, deleteEmployment: boolean) => void
}) {
  const [updateDate, setUpdateDate] = useState<Date>(new Date())

  const handleConfirm = () => {
    onConfirm(formatDate(updateDate), true)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>현장실습 조기종료</DialogTitle>
          <DialogDescription>
            실제 종료일을 선택하세요. 연결된 취업 이력은 자동으로 함께
            삭제됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className='flex w-full flex-col gap-3'>
          <p className='text-sm font-medium'>종료일</p>
          <div className='flex'>
            <Calendar
              mode='single'
              selected={updateDate}
              onSelect={(date) => date && setUpdateDate(date)}
              className='rounded-lg border border-border p-2'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleConfirm}>조기종료 처리하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
