import { useState } from 'react'
import { formatDate } from '@/utils/formatDate'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  DialogTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { ReasonSelect } from './reason-select'

const EARLY_END_REASONS = ['개인 사정', '회사 사정', '건강 문제']
const CONVERT_REASONS = ['채용 전환', '조기 취업']

export default function FieldTrainingEndDialog({
  open,
  onOpenChange,
  onConfirm,
  startDate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (endDate: string, convertToEmployment: boolean) => void
  startDate: Date
}) {
  const [updateDate, setUpdateDate] = useState<Date>(() =>
    new Date() >= startDate ? new Date() : startDate
  )
  const [convertToEmployment, setConvertToEmployment] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonEtc, setReasonEtc] = useState('')

  const handleConvertToggle = (v: boolean) => {
    setConvertToEmployment(v)
    setReason('')
    setReasonEtc('')
  }

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
              disabled={{ before: startDate }}
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
              onCheckedChange={handleConvertToggle}
            />
          </div>
          <ReasonSelect
            label={convertToEmployment ? '전환 사유' : '조기종료 사유'}
            options={convertToEmployment ? CONVERT_REASONS : EARLY_END_REASONS}
            value={reason}
            onChange={setReason}
            etcValue={reasonEtc}
            onEtcChange={setReasonEtc}
          />
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
