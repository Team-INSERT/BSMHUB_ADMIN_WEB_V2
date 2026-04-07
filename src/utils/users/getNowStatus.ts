import {
  FieldTrainingType,
  EmploymentCompaniesType,
  MilitaryServicesType,
  StudentUniversitiesType,
} from '@/features/users/data/schema'

export const fieldTrainingStatus: Record<number, string> = {
  0: '미취업',
  1: '현장 실습',
  2: '취업',
  3: '대학 진학',
  4: '군 복무 중',
}

const toYmd = (dateValue: string | null | undefined) => {
  if (!dateValue) return null
  return dateValue.split('T')[0].split(' ')[0]
}

export const getFieldTrainingStatus = (
  field_training: FieldTrainingType[] = [],
  employment_companies: EmploymentCompaniesType[] = [],
  military_services: MilitaryServicesType[] = [],
  student_universities: StudentUniversitiesType[] = []
) => {
  const now = new Date()
  const todayYmd = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  const isInMilitaryService = military_services.some(({ start_date, end_date }) => {
    const startYmd = toYmd(start_date)

    if (!startYmd || startYmd > todayYmd) {
      return false
    }

    return end_date === null
  })

  if (isInMilitaryService) {
    return fieldTrainingStatus[4]
  }

  const hasActiveUniversity = student_universities.some(
    ({ end_date }) => end_date === null
  )

  if (hasActiveUniversity) {
    return fieldTrainingStatus[3]
  }

  const activeEmployment = employment_companies.filter(
    (item) => item && !item?.deleted_at
  )

  const hasActiveEmployment = activeEmployment.some(({ end_date }) => {
    if (!end_date) return true
    const endDate = new Date(end_date)
    return now <= endDate
  })

  if (hasActiveEmployment) {
    return fieldTrainingStatus[2]
  }

  const activeFieldTraining = field_training.filter(
    (item) => item && !item.deleted_at
  )

  const isFieldTraining = activeFieldTraining.some(({ end_date }) => {
    if (!end_date) return true
    const endDate = new Date(end_date)
    return now <= endDate
  })

  return fieldTrainingStatus[isFieldTraining ? 1 : 0]
}
