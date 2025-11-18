import { useEffect, useMemo, useState } from 'react'
import { IconLoader2, IconRefresh, IconUsersGroup } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Loader from '@/components/loader'
import {
  CLEANER_DATASETS,
  CLEANER_GENERATIONS,
  ALL_GENERATIONS_TAB,
  type CleanerGenerationTabValue,
  type CleanerGenerationValue,
} from '../constants'
import {
  fetchEncryptedStudents,
  fetchStudents,
  type StudentRecord,
} from '../api'

const datasetLabelMap = CLEANER_DATASETS.reduce(
  (acc, dataset) => {
    acc[dataset.field] = dataset.label
    acc[dataset.field.replace('_file', '')] = dataset.label
    return acc
  },
  {} as Record<string, string>,
)

const subtleCrypto = getSubtleCrypto()

function getSubtleCrypto(): SubtleCrypto | null {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle
  }
  if (typeof globalThis !== 'undefined') {
    const crypto = (globalThis as typeof globalThis & { crypto?: Crypto }).crypto
    if (crypto?.subtle) return crypto.subtle
  }
  return null
}

function cleanPemInput(input: string) {
  if (!input) return ''
  return input
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/gi, '')
    .replace(/-----END (RSA )?PRIVATE KEY-----/gi, '')
    .replace(/\s+/g, '')
}

function base64ToArrayBuffer(base64: string) {
  if (typeof window === 'undefined') {
    const buffer = Buffer.from(base64, 'base64')
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    )
  }
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

async function importPrivateKey(pem: string) {
  if (!subtleCrypto) return null
  const cleaned = cleanPemInput(pem)
  const keyData = base64ToArrayBuffer(cleaned)
  try {
    return await subtleCrypto.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['decrypt'],
    )
  } catch {
    return null
  }
}

async function decryptPayloadRSA(payload: string, key: CryptoKey) {
  if (!subtleCrypto) return ''
  try {
    const cipherBuffer = base64ToArrayBuffer(payload)
    const decrypted = await subtleCrypto.decrypt(
      {
        name: 'RSA-OAEP',
      },
      key,
      cipherBuffer,
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    return ''
  }
}

const generationTabs: Array<{
  value: CleanerGenerationTabValue
  label: string
  helper: string
}> = [
  { value: ALL_GENERATIONS_TAB, label: '전체', helper: '모든 기수' },
  ...CLEANER_GENERATIONS.map((generation) => ({
    value: generation.value as CleanerGenerationTabValue,
    label: generation.label,
    helper: `${generation.year}년`,
  })),
]

function extractDecryptedName(text: string) {
  if (!text) return ''
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed.name === 'string') {
      return parsed.name
    }
  } catch {
    // fallback to regex-based extraction
  }
  const match = text.match(/"name"\s*:\s*"([^"]*)"/)
  if (match?.[1]) {
    return match[1].replace(/\\u([\dA-Fa-f]{4})/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    )
  }
  return ''
}

export function StudentDatasetsPanel() {
  const [activeTab, setActiveTab] =
    useState<CleanerGenerationTabValue>(ALL_GENERATIONS_TAB)
  const [condensedView, setCondensedView] = useState(true)
  const [encryptionKey, setEncryptionKey] = useState('')
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({})
  const [decryptDialogOpen, setDecryptDialogOpen] = useState(false)
  const [showDecryptedColumn, setShowDecryptedColumn] = useState(true)
  const [showHashColumn, setShowHashColumn] = useState(false)

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['cleaner-students', activeTab],
    queryFn: () =>
      fetchStudents(
        activeTab === ALL_GENERATIONS_TAB
          ? undefined
          : (activeTab as CleanerGenerationValue),
      ),
    staleTime: 1000 * 60 * 2,
  })

  const decryptMutation = useMutation({
    mutationFn: async (hashes: string[]) => {
      if (!hashes.length || !encryptionKey.trim()) return {}
      const uniqueHashes = Array.from(new Set(hashes))
      const privateKey = await importPrivateKey(encryptionKey.trim())
      if (!privateKey) {
        throw new Error('RSA 개인 키를 불러올 수 없습니다.')
      }
      const response = await fetchEncryptedStudents(uniqueHashes)
      const entries = await Promise.all(
        response.items.map(async (item) => {
          const decrypted = await decryptPayloadRSA(
            item.encrypted_payload,
            privateKey,
          )
          const name = extractDecryptedName(decrypted)
          return [item.student_hash, name || '복호화 실패'] as const
        }),
      )
      return Object.fromEntries(entries)
    },
    onSuccess: (map) => {
      setDecryptedMap(map)
      setShowDecryptedColumn(true)
      setDecryptDialogOpen(false)
    },
    onError: () => {
      setDecryptedMap({})
    },
  })

  const students = data?.students ?? []
  const totalDatasets = useMemo(
    () => students.reduce((acc, student) => acc + student.datasets.length, 0),
    [students],
  )

  useEffect(() => {
    setDecryptedMap({})
  }, [activeTab, students.length])

  return (
    <>
      <Card>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <CardTitle>학생 데이터 미리보기</CardTitle>
            <CardDescription>
              `/students` API에서 조회한 정제 데이터를 기수별로 빠르게 확인하세요.
            </CardDescription>
          </div>
          <div className='flex flex-1 flex-wrap items-center justify-end gap-3'>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={() => setDecryptDialogOpen(true)}
            >
              복호화 설정
            </Button>
            <label className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Checkbox
                id='show-decrypted'
                checked={showDecryptedColumn}
                onCheckedChange={(checked) =>
                  setShowDecryptedColumn(Boolean(checked))
                }
                disabled={!Object.keys(decryptedMap).length}
              />
              복호화 결과 표시
            </label>
            <label className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Checkbox
                id='show-hash'
                checked={showHashColumn}
                onCheckedChange={(checked) =>
                  setShowHashColumn(Boolean(checked))
                }
              />
              student_hash 표시
            </label>
            <label className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Checkbox
                id='condensed-view'
                checked={condensedView}
                onCheckedChange={(checked) =>
                  setCondensedView(Boolean(checked))
                }
              />
              요약 보기
            </label>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <IconLoader2 className='mr-2 size-4 animate-spin' />
              ) : (
                <IconRefresh className='mr-2 size-4' />
              )}
              새로고침
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Tabs
          value={String(activeTab)}
          onValueChange={(value) =>
            setActiveTab(
              value === ALL_GENERATIONS_TAB
                ? ALL_GENERATIONS_TAB
                : (Number(value) as CleanerGenerationValue),
            )
          }
          className='w-full'
        >
          <TabsList className='flex w-full flex-wrap gap-2'>
            {generationTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={String(tab.value)}
                className='flex-1 rounded-lg data-[state=active]:bg-muted'
              >
                <div className='flex flex-col items-center text-sm'>
                  <span className='font-semibold'>{tab.label}</span>
                  <span className='text-[11px] text-muted-foreground'>
                    {tab.helper}
                  </span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          {generationTabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={String(tab.value)}
              className='mt-4 space-y-4'
            >
              <SummaryRow
                totalStudents={students.length}
                totalDatasets={totalDatasets}
                generationLabel={
                  tab.value === ALL_GENERATIONS_TAB ? '전체' : tab.label
                }
              />
              <StudentTable
                students={students}
                isLoading={isLoading}
                condensedView={condensedView}
                decryptedMap={decryptedMap}
                showHashColumn={showHashColumn}
                showDecryptedColumn={showDecryptedColumn}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
    <Dialog open={decryptDialogOpen} onOpenChange={setDecryptDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>복호화 키 입력</DialogTitle>
          <DialogDescription>
            RSA 4096 / OAEP(SHA-256) 개인 키를 입력한 뒤 복호화를 실행하세요. 키는
            브라우저 메모리에서만 사용됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <Input
            placeholder='-----BEGIN PRIVATE KEY----- ...'
            value={encryptionKey}
            onChange={(event) => setEncryptionKey(event.target.value)}
            className='font-mono'
          />
          <p className='text-xs text-muted-foreground'>
            현재 학생 수: {students.length.toLocaleString()}명
          </p>
        </div>
        <DialogFooter className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setDecryptDialogOpen(false)}
          >
            취소
          </Button>
          <Button
            type='button'
            onClick={() =>
              decryptMutation.mutate(students.map((s) => s.student_hash))
            }
            disabled={
              !encryptionKey.trim() ||
              decryptMutation.isPending ||
              !students.length ||
              !subtleCrypto
            }
          >
            {decryptMutation.isPending ? (
              <IconLoader2 className='mr-2 size-4 animate-spin' />
            ) : null}
            복호화 실행
          </Button>
        </DialogFooter>
        {!subtleCrypto && (
          <p className='text-xs text-destructive'>
            현재 환경에서는 Web Crypto API를 사용할 수 없어 복호화를 실행할 수
            없습니다.
          </p>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}

function SummaryRow({
  totalStudents,
  totalDatasets,
  generationLabel,
}: {
  totalStudents: number
  totalDatasets: number
  generationLabel: string
}) {
  return (
    <div className='grid gap-3 rounded-xl border bg-card/40 p-4 text-sm sm:grid-cols-3'>
      <div className='flex items-center gap-3'>
        <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <IconUsersGroup className='size-5' />
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>조회된 학생</p>
          <p className='text-xl font-semibold'>{totalStudents.toLocaleString()}</p>
        </div>
      </div>
      <Separator className='sm:hidden' />
      <div>
        <p className='text-xs text-muted-foreground'>데이터셋 수</p>
        <p className='text-xl font-semibold'>{totalDatasets.toLocaleString()}</p>
      </div>
      <Separator className='sm:hidden' />
      <div>
        <p className='text-xs text-muted-foreground'>선택된 기수</p>
        <p className='text-xl font-semibold'>{generationLabel}</p>
      </div>
    </div>
  )
}

function StudentTable({
  students,
  isLoading,
  condensedView,
  decryptedMap,
  showHashColumn,
  showDecryptedColumn,
}: {
  students: StudentRecord[]
  isLoading: boolean
  condensedView: boolean
  decryptedMap: Record<string, string>
  showHashColumn: boolean
  showDecryptedColumn: boolean
}) {
  if (isLoading) {
    return (
      <div className='flex h-48 items-center justify-center rounded-xl border border-dashed'>
        <Loader />
      </div>
    )
  }

  if (!students.length) {
    return (
      <div className='rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground'>
        조회된 학생이 없습니다. 먼저 CSV/Excel 데이터를 업로드한 뒤 다시 시도하세요.
      </div>
    )
  }

  type DatasetEntry = {
    student: StudentRecord
    datasetLabel: string
    rows: Array<Record<string, unknown>>
    columnKeys: string[]
  }

  const flattenedEntries: DatasetEntry[] = []
  const studentRowSpans = new Map<string, number>()
  const studentIndexMap = new Map<string, number>()

  students.forEach((student, index) => {
    studentIndexMap.set(student.student_hash, index + 1)
  })

  students.forEach((student) => {
    const datasets = student.datasets.length
      ? student.datasets
      : [
          {
            dataset: 'none',
            rows: [],
          },
        ]

    const entries = datasets.map((dataset) => {
      const columnKeys = Array.from(
        new Set(
          dataset.rows.flatMap((row) =>
            Object.keys((row as Record<string, unknown>) ?? {}),
          ),
        ),
      )

      return {
        student,
        datasetLabel:
          dataset.dataset === 'none'
            ? '데이터 없음'
            : datasetLabelMap[dataset.dataset] || dataset.dataset,
        rows: dataset.rows as Array<Record<string, unknown>>,
        columnKeys,
      }
    })

    flattenedEntries.push(...entries)
    studentRowSpans.set(
      student.student_hash,
      entries.length || 1,
    )
  })

  const renderedStudent = new Set<string>()

  const showDetail = !condensedView
  const canShowDecryptedColumn =
    showDecryptedColumn && Object.keys(decryptedMap).length > 0
  const canShowHashColumn = showHashColumn

  return (
    <ScrollArea className='h-[360px] rounded-xl border'>
      <Table>
        <TableHeader className='bg-muted/30'>
          <TableRow>
            <TableHead className='w-[120px]'>학생 번호</TableHead>
            <TableHead className='w-[80px]'>기수</TableHead>
            {canShowHashColumn && (
              <TableHead className='w-[200px]'>student_hash</TableHead>
            )}
            {canShowDecryptedColumn && (
              <TableHead className='w-[200px]'>복호화 결과</TableHead>
            )}
            <TableHead className='w-[140px]'>데이터셋</TableHead>
            <TableHead className='w-[100px] text-center'>행 수</TableHead>
            {showDetail && <TableHead>데이터 내용</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {flattenedEntries.map((entry, index) => {
            const studentHash = entry.student.student_hash
            const showStudentCell = !renderedStudent.has(studentHash)

            if (showStudentCell) {
              renderedStudent.add(studentHash)
            }

            return (
              <TableRow key={`${studentHash}-${entry.datasetLabel}-${index}`}>
                {showStudentCell && (
              <>
                <TableCell rowSpan={studentRowSpans.get(studentHash)}>
                  <code className='rounded bg-muted px-2 py-1 text-xs'>
                    {studentIndexMap.get(studentHash)}
                  </code>
                </TableCell>
                <TableCell rowSpan={studentRowSpans.get(studentHash)}>
                  {entry.student.generation}
                </TableCell>
                {canShowHashColumn && (
                  <TableCell rowSpan={studentRowSpans.get(studentHash)}>
                    <code className='rounded bg-muted px-2 py-1 text-[11px]'>
                      {studentHash}
                    </code>
                  </TableCell>
                )}
                {canShowDecryptedColumn && (
                  <TableCell rowSpan={studentRowSpans.get(studentHash)}>
                    <span className='text-xs text-muted-foreground'>
                      {decryptedMap[studentHash] || '-'}
                    </span>
                      </TableCell>
                    )}
                  </>
                )}
                <TableCell className='font-semibold'>
                  {entry.datasetLabel}
                </TableCell>
                <TableCell className='text-center font-mono text-xs'>
                  {entry.rows.length.toLocaleString()}
                </TableCell>
                <TableCell>
                  {showDetail ? (
                    <DatasetGrid
                      rows={entry.rows}
                      columnKeys={entry.columnKeys}
                    />
                  ) : (
                    <DatasetSummary rows={entry.rows} />
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

function DatasetGrid({
  rows,
  columnKeys,
}: {
  rows: Array<Record<string, unknown>>
  columnKeys: string[]
}) {
  if (!rows.length) {
    return (
      <div className='rounded border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground'>
        데이터 행이 없습니다.
      </div>
    )
  }

  return (
    <div className='w-full overflow-x-auto rounded border'>
      <table className='w-full min-w-[320px] text-left text-[11px]'>
        <thead className='bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground'>
          <tr>
            <th className='px-2 py-1 text-center'>#</th>
            {columnKeys.map((key) => (
              <th key={key} className='px-2 py-1'>
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className='odd:bg-muted/20'>
              <td className='px-2 py-1 text-center font-mono text-[10px]'>
                {rowIndex + 1}
              </td>
              {columnKeys.map((key) => (
                <td key={key} className='px-2 py-1 font-mono text-[11px]'>
                  {formatCellValue((row as Record<string, unknown>)[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DatasetSummary({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows.length) {
    return (
      <div className='rounded border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground'>
        데이터 행이 없습니다.
      </div>
    )
  }

  const firstRow = rows[0]
  const previewEntries = Object.entries(firstRow ?? {}).slice(0, 4)

  return (
    <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
      {previewEntries.map(([key, value]) => (
        <span
          key={key}
          className='rounded-full border bg-muted/30 px-2 py-1 font-mono text-[11px] text-foreground'
        >
          {key}: {formatCellValue(value)}
        </span>
      ))}
      {rows.length > 1 && (
        <span className='rounded-full bg-muted px-2 py-1 text-[11px] text-foreground'>
          + {rows.length - 1}행
        </span>
      )}
    </div>
  )
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
