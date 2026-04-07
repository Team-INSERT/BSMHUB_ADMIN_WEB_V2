import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useHandleStudentUniversityMutation } from '../services/student-universities/handleStudentUniversity'
import { UNIV } from './career-types'

export function UniversityCard({
  univ,
  studentId,
}: {
  univ: UNIV
  studentId: string
}) {
  const { mutateAsync: univMutate } = useHandleStudentUniversityMutation()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: [`user-${studentId}`] }),
    ])

  const handleDelete = async () => {
    try {
      await univMutate([
        {
          action: 'delete',
          datas: {
            student_university: {
              student_id: studentId,
              university_name: univ.universities.university_name,
              university_department: univ.universities.university_department,
              university_id: univ.universities.university_id,
            },
          },
        },
      ])
      await invalidate()
      toast({ title: '삭제되었습니다.' })
    } catch {
      toast({ variant: 'destructive', title: '삭제에 실패했습니다.' })
    }
  }

  return (
    <div className='overflow-hidden rounded-md border border-l-4 border-l-orange-400'>
      <div className='flex w-full items-center justify-between p-3'>
        <div className='space-y-0.5'>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='text-xs'>
              대학교
            </Badge>
            <span className='font-medium'>
              {univ.universities.university_name}
            </span>
          </div>
          <p className='text-sm text-muted-foreground'>
            {univ.universities.university_department ?? '-'}
          </p>
        </div>
        <Button variant='destructive' size='sm' onClick={handleDelete}>
          삭제
        </Button>
      </div>
    </div>
  )
}
