import { type ReactNode, useMemo, useState } from 'react'
import {
  IconLoader2,
  IconSparkles,
  IconStars,
} from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  PredictionResponse,
  requestStudentPrediction,
} from '../api'
import { SAMPLE_STUDENT_HASH } from '../constants'

export function PredictionPanel() {
  const [studentHash, setStudentHash] = useState('')
  const [result, setResult] = useState<PredictionResponse | null>(null)

  const mutation = useMutation({
    mutationFn: requestStudentPrediction,
    onSuccess: (data) => {
      setResult(data)
      toast({
        title: '예측을 가져왔습니다.',
        description: `학생 ${data.student.student_hash} 의 등급: ${data.prediction}`,
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '예측을 불러오지 못했습니다.',
        description: error.message,
      })
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!studentHash.trim()) {
      toast({
        variant: 'destructive',
        title: '학생 해시가 필요합니다.',
        description: '예측하고 싶은 학생의 해시를 입력해주세요.',
      })
      return
    }
    mutation.mutate(studentHash.trim())
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>학생 단일 예측</CardTitle>
        <CardDescription>
          학생 해시를 입력하면 현재 배포된 SANDEUL 모델이 성적 예측을 반환합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        <form
          className='space-y-3 rounded-lg border bg-muted/30 p-4'
          onSubmit={handleSubmit}
        >
          <div className='grid gap-3 md:grid-cols-[1.5fr_auto]'>
            <div>
              <Label htmlFor='student-hash'>학생 해시</Label>
              <Input
                id='student-hash'
                placeholder='예: b60f0dc034...'
                value={studentHash}
                onChange={(event) => setStudentHash(event.target.value)}
              />
              <p className='mt-1 text-xs text-muted-foreground'>
                Supabase student_hash 또는 proxy 키를 입력하세요.
              </p>
            </div>
            <div className='flex items-end gap-2'>
              <Button
                type='button'
                variant='outline'
                className='whitespace-nowrap'
                onClick={() => setStudentHash(SAMPLE_STUDENT_HASH)}
                disabled={mutation.isPending}
              >
                샘플 값 사용
              </Button>
              <Button type='submit' disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <IconLoader2 className='mr-2 size-4 animate-spin' />
                    조회 중...
                  </>
                ) : (
                  <>
                    <IconStars className='mr-2 size-4' />
                    예측 실행
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        <PredictionResult result={result} isLoading={mutation.isPending} />
      </CardContent>
    </Card>
  )
}

function PredictionResult({
  result,
  isLoading,
}: {
  result: PredictionResponse | null
  isLoading: boolean
}) {
  const probabilityEntries = useMemo(() => {
    if (!result?.probabilities) return []
    return Object.entries(result.probabilities)
      .map(([label, value]) => ({
        label,
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }, [result])

  if (!result) {
    return (
      <div className='min-h-[220px] rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
        학생 해시로 예측을 실행하면 모델 결과가 여기에 표시됩니다.
      </div>
    )
  }

  const topProbability = probabilityEntries[0]?.value ?? 0

  return (
    <div className='space-y-4 rounded-lg border bg-card p-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-sm text-muted-foreground'>예측 결과</p>
          <p className='text-2xl font-semibold'>{result.prediction}</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='secondary'>기수: {result.generation}</Badge>
          {result.model_artifact ? (
            <Badge variant='outline'>{result.model_artifact}</Badge>
          ) : null}
        </div>
      </div>
      <div className='grid gap-3 md:grid-cols-2'>
        <DetailTile
          label='예측 신뢰도'
          value={`${(topProbability * 100).toFixed(1)}%`}
          icon={<IconSparkles className='size-4 text-primary' />}
        />
        <DetailTile
          label='실제 레이블'
          value={result.actual_label || '미제공'}
        />
      </div>
      <Separator />
      <div>
        <p className='mb-2 text-sm font-medium'>클래스별 확률</p>
        <div className='space-y-2'>
          {probabilityEntries.map((entry) => (
            <ProbabilityRow
              key={entry.label}
              label={entry.label}
              value={entry.value}
              isPrimary={entry.label === result.prediction}
            />
          ))}
        </div>
      </div>
      {result.features_used?.length ? (
        <div>
          <p className='mb-2 text-sm font-medium'>사용된 주요 피처</p>
          <ScrollArea className='h-24'>
            <div className='flex flex-wrap gap-2 p-1'>
              {result.features_used.map((feature) => (
                <Badge key={feature} variant='outline' className='text-xs'>
                  {feature}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : null}
      {isLoading && (
        <div className='flex items-center gap-2 rounded-md border border-dashed p-2 text-xs text-muted-foreground'>
          <IconLoader2 className='size-4 animate-spin' />
          최신 예측을 불러오는 중입니다.
        </div>
      )}
    </div>
  )
}

function DetailTile({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: ReactNode
}) {
  return (
    <div className='rounded-lg border bg-background p-3 text-sm'>
      <div className='flex items-center gap-2 text-muted-foreground'>
        {icon}
        <span>{label}</span>
      </div>
      <p className='mt-1 text-lg font-semibold'>{value}</p>
    </div>
  )
}

function ProbabilityRow({
  label,
  value,
  isPrimary,
}: {
  label: string
  value: number
  isPrimary: boolean
}) {
  return (
    <div
      className={`rounded-md border p-3 text-sm ${isPrimary ? 'border-primary bg-primary/5' : ''}`}
    >
      <div className='flex items-center justify-between'>
        <span className='font-medium'>{label}</span>
        <span>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className='mt-2 h-2 rounded-full bg-muted'>
        <div
          className='h-full rounded-full bg-primary'
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
    </div>
  )
}
