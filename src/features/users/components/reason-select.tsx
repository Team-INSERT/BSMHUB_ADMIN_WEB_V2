import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ReasonSelect({
  label = '사유',
  options,
  value,
  onChange,
  etcValue,
  onEtcChange,
}: {
  label?: string
  options: string[]
  value: string
  onChange: (v: string) => void
  etcValue: string
  onEtcChange: (v: string) => void
}) {
  return (
    <>
      <p className='text-sm font-medium'>{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder='사유를 선택하세요' />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
          <SelectItem value='기타'>기타</SelectItem>
        </SelectContent>
      </Select>
      {value === '기타' && (
        <Input
          placeholder='사유를 직접 입력하세요'
          value={etcValue}
          onChange={(e) => onEtcChange(e.target.value)}
        />
      )}
    </>
  )
}
