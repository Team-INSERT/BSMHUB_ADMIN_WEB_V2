import { useMemo, useState } from 'react'
import { IconLoader2, IconRefresh, IconTrendingUp } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchCorrelations } from '../api'

type Mode = 'all' | 'custom'

export function CorrelationPanel() {
  const [mode, setMode] = useState<Mode>('all')
  const [customGeneration, setCustomGeneration] = useState('')
  const [applied, setApplied] = useState<{ mode: Mode; generation?: number }>(
    { mode: 'all' }
  )

  const generation = applied.mode === 'custom' ? applied.generation : undefined

  const { data, isFetching, isLoading } = useQuery({
    queryKey: ['correlations', applied.mode, generation ?? 'all'],
    queryFn: () => fetchCorrelations(generation),
    staleTime: 1000 * 60 * 5,
  })

  const handleApply = () => {
    if (mode === 'custom') {
      const parsed = Number(customGeneration)
      if (!parsed || parsed < 1) {
        toast({
          variant: 'destructive',
          title: '유효한 기수를 입력해주세요.',
        })
        return
      }
      setApplied({ mode: 'custom', generation: parsed })
    } else {
      setApplied({ mode: 'all' })
    }
  }

  const correlations = useMemo(() => {
    if (!data?.correlations) return []
    return [...data.correlations].sort((a, b) => b.absolute - a.absolute)
  }, [data?.correlations])
  const topFeature = correlations[0]

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>상관관계 분석</CardTitle>
        <CardDescription>
          SQLite에 적재된 특징량을 기반으로 레이블과의 Pearson 상관 계수를 확인합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-[2fr_1fr_auto]'>
          <div className='space-y-3'>
            <Label className='text-xs uppercase text-muted-foreground'>
              분석 대상
            </Label>
            <RadioGroup
              className='grid gap-2 sm:grid-cols-2'
              value={mode}
              onValueChange={(value) => setMode(value as Mode)}
            >
              <div>
                <RadioGroupItem
                  value='all'
                  id='mode-all'
                  className='sr-only peer'
                />
                <Label
                  htmlFor='mode-all'
                  className='flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10'
                >
                  전체 기수
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value='custom'
                  id='mode-custom'
                  className='sr-only peer'
                />
                <Label
                  htmlFor='mode-custom'
                  className='flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10'
                >
                  특정 기수
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='generation-filter'>기수 번호</Label>
            <Input
              id='generation-filter'
              type='number'
              placeholder='예: 3'
              value={customGeneration}
              onChange={(event) => setCustomGeneration(event.target.value)}
              disabled={mode !== 'custom'}
            />
          </div>
          <div className='flex items-end'>
            <Button
              type='button'
              onClick={handleApply}
              disabled={isFetching}
              className='w-full'
            >
              {isFetching ? (
                <IconLoader2 className='mr-2 size-4 animate-spin' />
              ) : (
                <IconRefresh className='mr-2 size-4' />
              )}
              분석 새로고침
            </Button>
          </div>
        </div>

        <div className='grid gap-3 md:grid-cols-3'>
          <StatTile
            label='사용 행'
            value={`${data?.rows_used ?? 0} / ${data?.rows_received ?? 0}`}
            helper='Rows used / received'
          />
          <StatTile
            label='분석 피처 수'
            value={`${data?.features_analyzed ?? 0} 개`}
            helper={`건너뛴 피처 ${
              data?.skipped_features?.length ?? 0
            }개`}
          />
          <StatTile
            label='가장 높은 상관'
            value={
              topFeature
                ? `${topFeature.feature} (${topFeature.pearson.toFixed(2)})`
                : '-'
            }
            helper='양수/음수 구간 모두 표시'
          />
        </div>

        <Separator />

        {isLoading ? (
          <div className='space-y-2'>
            {[...Array(5)].map((_, idx) => (
              <Skeleton key={idx} className='h-10 w-full rounded-md' />
            ))}
          </div>
        ) : correlations.length === 0 ? (
          <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
            분석 가능한 데이터가 없습니다. 먼저 데이터셋을 정제하고 다시 시도하세요.
          </div>
        ) : (
          <ScrollArea className='h-[300px]'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Absolute</TableHead>
                  <TableHead>Pearson</TableHead>
                  <TableHead>Rows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {correlations.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline'>{row.feature}</Badge>
                        {row === topFeature && (
                          <Badge variant='secondary'>Top</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{row.absolute.toFixed(2)}</TableCell>
                    <TableCell>{row.pearson.toFixed(2)}</TableCell>
                    <TableCell>{row.overlap_rows}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {data?.skipped_features?.length ? (
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-sm font-medium'>건너뛴 피처</p>
            <div className='mt-2 flex flex-wrap gap-2'>
              {data.skipped_features.map((feature) => (
                <Badge key={feature} variant='outline' className='text-xs'>
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function StatTile({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className='rounded-lg border bg-background p-4 text-sm'>
      <div className='flex items-center gap-2 text-muted-foreground'>
        <IconTrendingUp className='size-4' />
        <span>{label}</span>
      </div>
      <p className='mt-1 text-xl font-semibold'>{value}</p>
      {helper ? (
        <p className='text-xs text-muted-foreground'>{helper}</p>
      ) : null}
    </div>
  )
}
