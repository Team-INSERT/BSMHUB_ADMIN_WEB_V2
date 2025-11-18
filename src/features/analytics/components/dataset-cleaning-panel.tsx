import { useMemo, useState } from 'react'
import {
  IconAlertCircle,
  IconLoader2,
  IconUpload,
  IconX,
} from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ANALYTICS_DATASETS,
  ANALYTICS_GENERATIONS,
  AnalyticsDatasetField,
  AnalyticsGenerationValue,
  DEFAULT_GENERATION,
} from '../constants'
import { requestDatasetCleaning } from '../api'

const createEmptyDatasetMap = () =>
  ANALYTICS_DATASETS.reduce(
    (acc, dataset) => {
      acc[dataset.field] = []
      return acc
    },
    {} as Record<AnalyticsDatasetField, File[]>
  )

const createInitialGenerationState = () =>
  ANALYTICS_GENERATIONS.reduce(
    (acc, generation) => {
      acc[generation.value] = createEmptyDatasetMap()
      return acc
    },
    {} as Record<
      AnalyticsGenerationValue,
      Record<AnalyticsDatasetField, File[]>
    >
  )

const getDefaultGenerationFromYear = (): AnalyticsGenerationValue => {
  const targetYear = new Date().getFullYear() - 2
  const matched = ANALYTICS_GENERATIONS.find(
    (generation) => generation.year === targetYear
  )
  return (matched?.value ?? DEFAULT_GENERATION) as AnalyticsGenerationValue
}

export function DatasetCleaningPanel() {
  const [activeGeneration, setActiveGeneration] =
    useState<AnalyticsGenerationValue>(getDefaultGenerationFromYear)
  const [filesByGeneration, setFilesByGeneration] = useState<
    Record<AnalyticsGenerationValue, Record<AnalyticsDatasetField, File[]>>
  >(createInitialGenerationState)

  const currentFiles =
    filesByGeneration[activeGeneration] ?? createEmptyDatasetMap()

  const totalFiles = useMemo(
    () =>
      Object.values(currentFiles || {}).reduce(
        (acc, curr) => acc + curr.length,
        0
      ),
    [currentFiles]
  )

  const mutation = useMutation({
    mutationFn: requestDatasetCleaning,
    onMutate: () => {
      // 업로드 시작 시 진행 중 토스트 표시
      toast({
        title: '데이터 업로드 중입니다...',
        description: '데이터를 처리하는 중이니 잠시만 기다려주세요.',
      })
    },
    onSuccess: (data) => {
      toast({
        title: '클리닝 요청이 성공적으로 처리되었습니다!',
        description: `요청 ID: ${data.request_id} | 기수: ${data.generation}`,
      })
      setFilesByGeneration((prev) => ({
        ...prev,
        [activeGeneration]: createEmptyDatasetMap(),
      }))
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '업로드에 실패했습니다.',
        description: error.message,
      })
    },
  })

  const updateGenerationFiles = (
    generation: AnalyticsGenerationValue,
    updater: (
      files: Record<AnalyticsDatasetField, File[]>
    ) => Record<AnalyticsDatasetField, File[]>
  ) => {
    setFilesByGeneration((prev) => ({
      ...prev,
      [generation]: updater(prev[generation]),
    }))
  }

  const handleFileChange = (
    generation: AnalyticsGenerationValue,
    field: AnalyticsDatasetField,
    fileList: FileList | null
  ) => {
    if (!fileList?.length) return
    updateGenerationFiles(generation, (files) => ({
      ...files,
      [field]: [...files[field], ...Array.from(fileList)],
    }))
  }

  const removeFile = (
    generation: AnalyticsGenerationValue,
    field: AnalyticsDatasetField,
    index: number
  ) => {
    updateGenerationFiles(generation, (files) => ({
      ...files,
      [field]: files[field].filter((_, idx) => idx !== index),
    }))
  }

  const clearField = (
    generation: AnalyticsGenerationValue,
    field: AnalyticsDatasetField
  ) => {
    updateGenerationFiles(generation, (files) => ({
      ...files,
      [field]: [],
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (totalFiles === 0) {
      toast({
        variant: 'destructive',
        title: '업로드할 파일이 필요합니다.',
        description: '최소 1개 이상의 데이터를 선택해주세요.',
      })
      return
    }
    const activeFiles =
      filesByGeneration[activeGeneration] ?? createEmptyDatasetMap()

    mutation.mutate({
      generation: activeGeneration,
      files: Object.entries(activeFiles).reduce(
        (acc, [field, files]) => {
          if (files.length) {
            acc[field as AnalyticsDatasetField] = files
          }
          return acc
        },
        {} as Record<AnalyticsDatasetField, File[]>
      ),
    })
  }

  const isSubmitting = mutation.isPending

  return (
    <Card>
      <CardHeader className='space-y-3'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <CardTitle>Advanced Analytics 데이터 업로드</CardTitle>
            <CardDescription>
              기수와 데이터셋을 선택해 자동 정제 및 SQLite 적재를 실행합니다.
            </CardDescription>
          </div>
          <Badge variant='secondary' className='text-xs'>
            업로드된 파일 {totalFiles}개
          </Badge>
        </div>
          <Alert>
            <IconAlertCircle className='size-4 text-muted-foreground' />
            <AlertTitle>여러 파일 업로드 안내</AlertTitle>
            <AlertDescription>
              같은 필드에 여러 파일을 추가하려면 한 번에 다중 선택하거나, 업로드 후 계속 추가할 수 있습니다.
            </AlertDescription>
          </Alert>
        </CardHeader>
      <CardContent>
        <form className='space-y-6' onSubmit={handleSubmit}>
            <div className='space-y-4'>
              <div className='rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground'>
                서버 기본 URL은{' '}
                <span className='font-semibold'>환경 변수</span> 또는
                <span className='font-semibold'> http://localhost:8000</span> 로
                지정됩니다.
              </div>
              <Tabs
                value={String(activeGeneration)}
                onValueChange={(value) =>
                  setActiveGeneration(Number(value) as AnalyticsGenerationValue)
                }
                className='space-y-4'
              >
                <TabsList className='flex w-full flex-wrap gap-2'>
                  {ANALYTICS_GENERATIONS.map((generation) => (
                    <TabsTrigger
                      key={generation.value}
                      value={String(generation.value)}
                      className='flex-1 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary'
                    >
                      <div className='flex flex-col items-center'>
                        <span className='text-sm font-semibold'>
                          {generation.label}
                        </span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {ANALYTICS_GENERATIONS.map((generation) => (
                  <TabsContent key={generation.value} value={String(generation.value)}>
                    <KanbanBoard
                      generation={generation.value as AnalyticsGenerationValue}
                      files={filesByGeneration[generation.value]}
                      disabled={isSubmitting}
                      onFileAdd={(field, list) =>
                        handleFileChange(
                          generation.value as AnalyticsGenerationValue,
                          field,
                          list
                        )
                      }
                      onRemoveFile={(field, index) =>
                        removeFile(
                          generation.value as AnalyticsGenerationValue,
                          field,
                          index
                        )
                      }
                      onClear={(field) =>
                        clearField(
                          generation.value as AnalyticsGenerationValue,
                          field
                        )
                      }
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className='flex flex-wrap items-center justify-between gap-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={() =>
                  setFilesByGeneration((prev) => ({
                    ...prev,
                    [activeGeneration]: createEmptyDatasetMap(),
                  }))
                }
                disabled={isSubmitting || totalFiles === 0}
              >
                현재 탭 파일 초기화
              </Button>
              <Button type='submit' disabled={isSubmitting || totalFiles === 0}>
                {isSubmitting ? (
                  <>
                    <IconLoader2 className='mr-2 size-4 animate-spin' />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <IconUpload className='mr-2 size-4' />
                    정제 요청 보내기
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  )
}

type KanbanBoardProps = {
  generation: AnalyticsGenerationValue
  files: Record<AnalyticsDatasetField, File[]>
  disabled: boolean
  onFileAdd: (field: AnalyticsDatasetField, files: FileList | null) => void
  onRemoveFile: (field: AnalyticsDatasetField, index: number) => void
  onClear: (field: AnalyticsDatasetField) => void
}

function KanbanBoard({
  generation,
  files,
  disabled,
  onFileAdd,
  onRemoveFile,
  onClear,
}: KanbanBoardProps) {
  return (
    <ScrollArea orientation='horizontal' className='w-full'>
      <div className='flex min-w-full gap-4 pb-2'>
        {ANALYTICS_DATASETS.map((dataset) => (
          <KanbanColumn
            key={`${generation}-${dataset.field}`}
            dataset={dataset}
            files={files[dataset.field]}
            disabled={disabled}
            generation={generation}
            onFileAdd={(fileList) => onFileAdd(dataset.field, fileList)}
            onRemoveFile={(index) => onRemoveFile(dataset.field, index)}
            onClear={() => onClear(dataset.field)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

type KanbanColumnProps = {
  dataset: (typeof ANALYTICS_DATASETS)[number]
  files: File[]
  disabled: boolean
  generation: AnalyticsGenerationValue
  onFileAdd: (files: FileList | null) => void
  onRemoveFile: (index: number) => void
  onClear: () => void
}

function KanbanColumn({
  dataset,
  files,
  disabled,
  generation,
  onFileAdd,
  onRemoveFile,
  onClear,
}: KanbanColumnProps) {
  const inputId = `${dataset.field}-${generation}`
  return (
    <div className='flex w-[260px] shrink-0 flex-col gap-3 rounded-2xl border bg-card/80 p-4 shadow-sm'>
      <div className='flex items-center justify-between gap-2'>
        <div>
          <p className='text-base font-semibold'>{dataset.label}</p>
          <p className='text-xs text-muted-foreground'>{dataset.description}</p>
        </div>
        <Badge variant='outline'>{files.length}</Badge>
      </div>
      <div className='flex flex-col gap-2'>
        <Label
          htmlFor={inputId}
          className='flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-primary/5'
        >
          <IconUpload className='size-4' />
          파일 추가
        </Label>
        <input
          multiple
          id={inputId}
          name={dataset.field}
          type='file'
          className='hidden'
          disabled={disabled}
          onChange={(event) => {
            onFileAdd(event.target.files)
            event.target.value = ''
          }}
        />
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onClear}
          disabled={disabled || files.length === 0}
          className='justify-start'
        >
          <IconX className='mr-1 size-4' />
          비우기
        </Button>
      </div>
      <ScrollArea className='h-32 rounded-xl border bg-muted/20 p-2'>
        {files.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            아직 선택된 파일이 없습니다.
          </p>
        ) : (
          <ul className='space-y-2 text-sm'>
            {files.map((file, index) => (
              <li
                key={`${dataset.field}-${file.name}-${index}`}
                className='flex items-center justify-between gap-3 rounded-lg bg-background px-2 py-1'
              >
                <span className='truncate'>{file.name}</span>
                <button
                  type='button'
                  onClick={() => onRemoveFile(index)}
                  className='text-muted-foreground transition hover:text-destructive'
                >
                  <IconX className='size-4' />
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
