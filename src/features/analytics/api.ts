import {
  AnalyticsDatasetField,
  AnalyticsGenerationValue,
} from './constants'

const ANALYTICS_API_BASE = (
  import.meta.env.VITE_CLEANER_API_BASE || 'http://localhost:8000'
).replace(/\/$/, '')

const buildUrl = (path: string) => `${ANALYTICS_API_BASE}${path}`

type FetchOptions = RequestInit & { parse?: 'json' | 'text' }

async function handleResponse<T>(response: Response, parse: 'json' | 'text') {
  const parseBody = async () => {
    if (parse === 'text') {
      return (await response.text()) as T
    }
    return (await response.json()) as T
  }

  if (!response.ok) {
    try {
      const data = await response.json()
      const detail =
        data?.detail ||
        data?.message ||
        data?.error ||
        data?.status ||
        response.statusText
      throw new Error(
        typeof detail === 'string'
          ? detail
          : '요청 처리 중 오류가 발생했습니다.'
      )
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('요청 처리 중 오류가 발생했습니다.')
    }
  }

  return parseBody()
}

async function analyticsFetch<T>(
  path: string,
  { parse = 'json', ...options }: FetchOptions = {}
) {
  const response = await fetch(buildUrl(path), {
    ...options,
  })
  return handleResponse<T>(response, parse)
}

export type CleanRequestPayload = {
  generation: number
  files: Partial<Record<AnalyticsDatasetField, File[]>>
}

export type CleanResult = {
  dataset: string
  status: 'ok' | 'error'
  processed_sheets?: string[]
  sqlite_rows?: number
  sqlite_tables?: string[]
  generation?: number
  message?: string
  detail?: string
}

export type CleanResponse = {
  request_id: string
  results: CleanResult[]
  success: boolean
  generation: number
}

export async function requestDatasetCleaning({
  generation,
  files,
}: CleanRequestPayload) {
  const formData = new FormData()
  formData.append('generation', String(generation))

  Object.entries(files).forEach(([field, list]) => {
    if (!list?.length) return
    list.forEach((file) => {
      formData.append(field, file)
    })
  })

  return analyticsFetch<CleanResponse>('/clean', {
    method: 'POST',
    body: formData,
  })
}

export type PredictionResponse = {
  student: {
    id: number
    student_hash: string
  }
  prediction: string
  probabilities: Record<string, number>
  generation: string
  features_used: string[]
  actual_label?: string
  model_artifact?: string
}

export async function requestStudentPrediction(studentHash: string) {
  return analyticsFetch<PredictionResponse>('/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ student_hash: studentHash }),
  })
}

export type CorrelationResponse = {
  label: string
  rows_received: number
  rows_used: number
  features_analyzed: number
  skipped_features: string[]
  correlations: Array<
    Correlation & {
      feature: string
      feature_label?: string
    }
  >
}

export async function fetchCorrelations(generation?: number) {
  const search = generation ? `?generation=${generation}` : ''
  return analyticsFetch<CorrelationResponse>(
    `/analytics/correlations/sqlite${search}`
  )
}

export type Correlation = {
  pearson: number
  absolute?: number
  overlap_rows?: number
}

export type NamedCorrelation = Correlation & {
  name?: string
  certificate_name?: string
  certificate?: string
  award_name?: string
  award?: string
  feature?: string
  label?: string
  sample_size?: number
}

export type NamedCorrelationResponse = {
  generation?: number
  correlations: NamedCorrelation[]
}

export async function fetchCertificateCorrelations(generation?: number) {
  const search = generation ? `?generation=${generation}` : ''
  return analyticsFetch<NamedCorrelationResponse>(
    `/analytics/certificates/correlations${search}`
  )
}

export type CertificateDateCorrelationResponse = {
  generation?: number
  correlation?: Correlation & {
    feature?: string
    name?: string
  }
}

export async function fetchCertificateDateCorrelation(generation?: number) {
  const search = generation ? `?generation=${generation}` : ''
  return analyticsFetch<CertificateDateCorrelationResponse>(
    `/analytics/certificates/correlation-by-date${search}`
  )
}

export async function fetchAwardCorrelations(generation?: number) {
  const search = generation ? `?generation=${generation}` : ''
  return analyticsFetch<NamedCorrelationResponse>(
    `/analytics/awards/correlations${search}`
  )
}

export async function fetchGradeCorrelations(generation?: number) {
  const search = generation ? `?generation=${generation}` : ''
  return analyticsFetch<NamedCorrelationResponse>(
    `/analytics/grades/correlations${search}`
  )
}

export async function fetchReport(generation?: number) {
  const search = generation ? `?generation=${generation}` : ''
  const response = await fetch(buildUrl(`/analytics/report${search}`))
  if (!response.ok) {
    throw new Error('리포트 생성에 실패했습니다.')
  }
  return response.blob()
}

export type StudentDataset = {
  dataset: string
  rows: Array<Record<string, unknown>>
}

export type StudentRecord = {
  student_hash: string
  generation: number
  datasets: StudentDataset[]
}

export type StudentsResponse = {
  count: number
  generation: string | number
  sort_by: string[]
  sort_dir: string[]
  students: StudentRecord[]
}

export async function fetchStudents(generation?: AnalyticsGenerationValue) {
  const searchParams = new URLSearchParams()
  if (generation) {
    searchParams.set('generation', String(generation))
  }
  const search = searchParams.toString()
  const path = `/students${search ? `?${search}` : ''}`
  return analyticsFetch<StudentsResponse>(path)
}

export type EncryptedStudentPayload = {
  student_hash: string
  encrypted_payload: string
}

export type StudentsEncryptedResponse = {
  count: number
  items: EncryptedStudentPayload[]
}

export async function fetchEncryptedStudents(studentHashes: string[]) {
  return analyticsFetch<StudentsEncryptedResponse>('/students/encrypted', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ student_hashes: studentHashes }),
  })
}

export { ANALYTICS_API_BASE }
