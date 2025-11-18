import { useEffect, useMemo, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  fetchAwardCorrelations,
  CertificateDateCorrelationResponse,
  CorrelationResponse,
  fetchCertificateCorrelations,
  fetchCertificateDateCorrelation,
  fetchCorrelations,
  NamedCorrelationResponse,
} from '../api'

type Mode = 'all' | 'custom'
type TabValue = 'sqlite' | 'certificates' | 'certificate-date' | 'awards'

type NormalizedRow = {
  label: string
  pearson: number
  absolute?: number
  overlap_rows?: number
  sample_size?: number
}

const TAB_META: Record<
  TabValue,
  {
    label: string
    description: string
  }
> = {
  sqlite: {
    label: '전체 피처',
    description: 'SQLite에 적재된 전 피처를 기반으로 한 상관계수',
  },
  certificates: {
    label: '자격증명',
    description: '자격증명별 취업 상관계수 (2명 이상 보유한 자격증만 포함)',
  },
  'certificate-date': {
    label: '자격증 취득일',
    description:
      '정보처리산업기사(과정평가형) 취득일과 취업 간 상관계수 (일 단위)',
  },
  awards: {
    label: '수상명',
    description: '수상명별 취업 상관계수 (2명 이상 동일 수상명)',
  },
}

const TAB_ORDER: TabValue[] = [
  'sqlite',
  'certificates',
  'certificate-date',
  'awards',
]

const resolveLabel = (record: Record<string, unknown>) => {
  const candidate =
    record.feature_label ||
    record.name ||
    record.feature ||
    record.certificate_name ||
    record.certificate ||
    record.award_name ||
    record.award ||
    record.label
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate
  }
  return '알 수 없음'
}

const normalizeRows = (rows?: unknown[]) => {
  if (!rows?.length) return []
  const normalized: NormalizedRow[] = []
  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return
    const record = row as Record<string, unknown>
    if (typeof record.pearson !== 'number') return
    normalized.push({
      label: resolveLabel(record),
      pearson: record.pearson,
      absolute:
        typeof record.absolute === 'number' ? record.absolute : undefined,
      overlap_rows:
        typeof record.overlap_rows === 'number'
          ? record.overlap_rows
          : undefined,
      sample_size:
        typeof record.sample_size === 'number'
          ? record.sample_size
          : undefined,
    })
  })

  return normalized.sort((a, b) => {
    const aAbs =
      typeof a.absolute === 'number' ? a.absolute : Math.abs(a.pearson)
    const bAbs =
      typeof b.absolute === 'number' ? b.absolute : Math.abs(b.pearson)
    return bAbs - aAbs
  })
}

export function CorrelationPanel() {
  const [mode, setMode] = useState<Mode>('all')
  const [customGeneration, setCustomGeneration] = useState('')
  const [applied, setApplied] = useState<{ mode: Mode; generation?: number }>(
    { mode: 'all' }
  )
  const [tab, setTab] = useState<TabValue>('sqlite')

  const generation = applied.mode === 'custom' ? applied.generation : undefined

  const sqliteQuery = useQuery<CorrelationResponse>({
    queryKey: ['correlations', 'sqlite', applied.mode, generation ?? 'all'],
    queryFn: () => fetchCorrelations(generation),
    staleTime: 1000 * 60 * 5,
  })

  const certificateQuery = useQuery<NamedCorrelationResponse>({
    queryKey: ['correlations', 'certificates', applied.mode, generation ?? 'all'],
    queryFn: () => fetchCertificateCorrelations(generation),
    staleTime: 1000 * 60 * 5,
  })

  const certificateDateQuery = useQuery<CertificateDateCorrelationResponse>({
    queryKey: [
      'correlations',
      'certificate-date',
      applied.mode,
      generation ?? 'all',
    ],
    queryFn: () => fetchCertificateDateCorrelation(generation),
    staleTime: 1000 * 60 * 5,
  })

  const awardQuery = useQuery<NamedCorrelationResponse>({
    queryKey: ['correlations', 'awards', applied.mode, generation ?? 'all'],
    queryFn: () => fetchAwardCorrelations(generation),
    staleTime: 1000 * 60 * 5,
  })

  const isRefreshing = [
    sqliteQuery,
    certificateQuery,
    certificateDateQuery,
    awardQuery,
  ].some((query) => query.isFetching)
  const sqliteLoading = sqliteQuery.isLoading
  const certificateLoading = certificateQuery.isLoading
  const certificateDateLoading = certificateDateQuery.isLoading
  const awardLoading = awardQuery.isLoading

  useEffect(() => {
    const contexts = [
      { error: sqliteQuery.error, context: '전체 피처 상관계수' },
      { error: certificateQuery.error, context: '자격증명 상관계수' },
      { error: certificateDateQuery.error, context: '자격증 취득일 상관계수' },
      { error: awardQuery.error, context: '수상명 상관계수' },
    ]

    contexts.forEach(({ error, context }) => {
      if (!error) return
      const message =
        error instanceof Error
          ? error.message
          : '상관관계 데이터를 불러오지 못했습니다.'
      toast({
        variant: 'destructive',
        title: `${context} 조회 실패`,
        description: message,
      })
    })
  }, [
    awardQuery.error,
    certificateDateQuery.error,
    certificateQuery.error,
    sqliteQuery.error,
  ])

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

  const sqliteCorrelations = useMemo(
    () => normalizeRows(sqliteQuery.data?.correlations),
    [sqliteQuery.data?.correlations]
  )
  const certificateCorrelations = useMemo(
    () => normalizeRows(certificateQuery.data?.correlations),
    [certificateQuery.data?.correlations]
  )
  const certificateDateCorrelations = useMemo(
    () =>
      normalizeRows(
        certificateDateQuery.data?.correlation
          ? [certificateDateQuery.data.correlation]
          : []
      ),
    [certificateDateQuery.data?.correlation]
  )
  const awardCorrelations = useMemo(
    () => normalizeRows(awardQuery.data?.correlations),
    [awardQuery.data?.correlations]
  )

  const topFeature = sqliteCorrelations[0]

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
              disabled={isRefreshing}
              className='w-full'
            >
              {isRefreshing ? (
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
            value={`${
              sqliteQuery?.data?.rows_used ?? 0
            } / ${sqliteQuery?.data?.rows_received ?? 0}`}
            helper='Rows used / received'
          />
          <StatTile
            label='분석 피처 수'
            value={`${sqliteQuery?.data?.features_analyzed ?? 0} 개`}
            helper={`건너뛴 피처 ${
              sqliteQuery?.data?.skipped_features?.length ?? 0
            }개`}
          />
          <StatTile
            label='가장 높은 상관'
            value={
              topFeature
                ? `${topFeature.label} (${topFeature.pearson.toFixed(2)})`
                : '-'
            }
            helper='양수/음수 구간 모두 표시'
          />
        </div>

        <Separator />

        <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
          <TabsList className='grid w-full grid-cols-2 md:grid-cols-4'>
            {TAB_ORDER.map((value) => (
              <TabsTrigger key={value} value={value}>
                {TAB_META[value].label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value='sqlite' className='space-y-3'>
            <p className='text-sm text-muted-foreground'>
              {TAB_META.sqlite.description}
            </p>
            <CorrelationChart
              title='상관계수 상위 10개'
              helper='Absolute 기준 상위 순서'
              rows={sqliteCorrelations}
              metric='absolute'
            />
            <CorrelationChart
              title='피어슨 계수 (부호 포함)'
              helper='값이 +1에 가까울수록 양의 상관, -1에 가까울수록 음의 상관'
              rows={sqliteCorrelations}
              metric='pearson'
            />
            <CorrelationTable
              rows={sqliteCorrelations}
              isLoading={sqliteLoading}
              emptyMessage='분석 가능한 데이터가 없습니다. 먼저 데이터셋을 정제하고 다시 시도하세요.'
              highlightLabel={topFeature?.label}
            />
            {sqliteQuery?.data?.skipped_features?.length ? (
              <div className='rounded-lg border bg-muted/30 p-3'>
                <p className='text-sm font-medium'>건너뛴 피처</p>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {sqliteQuery.data.skipped_features.map((feature) => (
                    <Badge key={feature} variant='outline' className='text-xs'>
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value='certificates' className='space-y-3'>
            <p className='text-sm text-muted-foreground'>
              {TAB_META.certificates.description}
            </p>
            <CorrelationChart
              title='자격증명 상위 10개'
              helper='Absolute 기준 상위 순서'
              rows={certificateCorrelations}
              metric='absolute'
            />
            <CorrelationChart
              title='자격증명 피어슨 계수'
              helper='부호를 포함해 취업과의 상관 정도를 확인합니다.'
              rows={certificateCorrelations}
              metric='pearson'
            />
            <CorrelationTable
              rows={certificateCorrelations}
              isLoading={certificateLoading}
              emptyMessage='조건을 만족하는 자격증명별 상관 데이터가 없습니다.'
            />
          </TabsContent>

          <TabsContent value='certificate-date' className='space-y-3'>
            <p className='text-sm text-muted-foreground'>
              {TAB_META['certificate-date'].description}
            </p>
            <CorrelationChart
              title='취득일 상관계수'
              helper='단일 피처 대상'
              rows={certificateDateCorrelations}
              metric='absolute'
            />
            <CorrelationChart
              title='취득일 피어슨 계수'
              helper='음/양의 상관을 함께 확인하세요.'
              rows={certificateDateCorrelations}
              metric='pearson'
            />
            <CorrelationTable
              rows={certificateDateCorrelations}
              isLoading={certificateDateLoading}
              emptyMessage='취득일 기반 상관 데이터가 없습니다.'
            />
          </TabsContent>

          <TabsContent value='awards' className='space-y-3'>
            <p className='text-sm text-muted-foreground'>
              {TAB_META.awards.description}
            </p>
            <CorrelationChart
              title='수상명 상위 10개'
              helper='Absolute 기준 상위 순서'
              rows={awardCorrelations}
              metric='absolute'
            />
            <CorrelationChart
              title='수상명 피어슨 계수'
              helper='부호를 포함해 확인'
              rows={awardCorrelations}
              metric='pearson'
            />
            <CorrelationTable
              rows={awardCorrelations}
              isLoading={awardLoading}
              emptyMessage='조건을 만족하는 수상명 상관 데이터가 없습니다.'
            />
          </TabsContent>
        </Tabs>
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

function CorrelationTable({
  rows,
  isLoading,
  emptyMessage,
  highlightLabel,
}: {
  rows: NormalizedRow[]
  isLoading: boolean
  emptyMessage: string
  highlightLabel?: string
}) {
  if (isLoading) {
    return (
      <div className='space-y-2'>
        {[...Array(5)].map((_, idx) => (
          <Skeleton key={idx} className='h-10 w-full rounded-md' />
        ))}
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
        {emptyMessage}
      </div>
    )
  }

  return (
    <ScrollArea className='h-[320px]'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>항목</TableHead>
            <TableHead>Pearson</TableHead>
            <TableHead>Absolute</TableHead>
            <TableHead>Rows/Samples</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>{row.label}</Badge>
                  {highlightLabel === row.label ? (
                    <Badge variant='secondary'>Top</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{row.pearson.toFixed(2)}</TableCell>
              <TableCell>
                {typeof row.absolute === 'number'
                  ? row.absolute.toFixed(2)
                  : Math.abs(row.pearson).toFixed(2)}
              </TableCell>
              <TableCell>
                {row.overlap_rows ?? row.sample_size ?? '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

function CorrelationChart({
  rows,
  title,
  helper,
  metric = 'absolute',
}: {
  rows: NormalizedRow[]
  title: string
  helper?: string
  metric?: 'absolute' | 'pearson'
}) {
  const chartData = useMemo(
    () =>
      rows.slice(0, 10).map((row) => ({
        name: row.label,
        value:
          metric === 'absolute'
            ? typeof row.absolute === 'number'
              ? Math.abs(row.absolute)
              : Math.abs(row.pearson)
            : row.pearson,
      })),
    [metric, rows]
  )

  if (!chartData.length) return null

  const domain = metric === 'pearson' ? [-1, 1] : [0, 1]

  return (
    <div className='rounded-lg border bg-background p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <p className='text-sm font-medium'>{title}</p>
          {helper ? (
            <p className='text-xs text-muted-foreground'>{helper}</p>
          ) : null}
        </div>
        <Badge variant='outline'>{chartData.length}개</Badge>
      </div>
      <div className='mt-3 h-64 w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={chartData}
            layout='vertical'
            margin={{ top: 8, right: 12, bottom: 8, left: 80 }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis type='number' domain={domain} tickFormatter={(v) => v.toFixed(1)} />
            <YAxis
              type='category'
              dataKey='name'
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => value.toFixed(2)}
              labelClassName='text-sm font-medium'
            />
            <Bar
              dataKey='value'
              fill={metric === 'pearson' ? undefined : 'hsl(var(--primary))'}
              radius={[4, 4, 4, 4]}
            >
              {metric === 'pearson'
                ? chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.value >= 0
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--destructive))'
                      }
                    />
                  ))
                : null}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
