import { useState } from 'react'
import { DialogTitle } from '@radix-ui/react-dialog'
import { formatDate } from '@/utils/formatDate'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

export default function FieldTrainingEndDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (endDate: string, convertToEmployment: boolean) => void
}) {
  const [updateDate, setUpdateDate] = useState<Date>(new Date())
  const [convertToEmployment, setConvertToEmployment] = useState(false)

  const handleConfirm = () => {
    onConfirm(formatDate(updateDate), convertToEmployment)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>현장실습 조기종료</DialogTitle>
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
          <div className='flex items-center justify-between rounded-md border p-3'>
            <div>
              <p className='text-sm font-medium'>취업으로 이어지기</p>
              <p className='text-xs text-muted-foreground'>
                {convertToEmployment
                  ? `종료일 다음날(${formatDate(new Date(updateDate.getTime() + 86400000))})부터 취업 이력이 시작됩니다.`
                  : '연결된 취업 이력이 자동으로 삭제됩니다.'}
              </p>
            </div>
            <Switch
              checked={convertToEmployment}
              onCheckedChange={setConvertToEmployment}
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
