import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type StudentTableProps = {
  students: Array<{
    student_id: string
    name: string
    description: string | null
    email: string | null
    department: string
    dreamJob: string | null
    skills: { skill_name: string }[]
    awards: { competition_name: string; prize: string }[]
    projects: { project_id: number; project_name: string }[]
    links: { link: string; alt: string | null }[]
  }>
  onStudentClick: (studentId: string) => void
}

export const StudentTable = ({
  students,
  onStudentClick,
}: StudentTableProps) => (
  <div className='overflow-auto rounded-md border'>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='px-2'>이름</TableHead>
          <TableHead className='px-2'>한줄소개</TableHead>
          <TableHead className='px-2'>학과</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>희망직무</TableHead>
          <TableHead className='text-center'>기술</TableHead>
          <TableHead className='text-center'>수상</TableHead>
          <TableHead className='text-center'>프로젝트</TableHead>
          <TableHead className='text-center'>링크</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow
            key={student.student_id}
            className='cursor-pointer hover:bg-muted/50'
            onClick={() => onStudentClick(student.student_id)}
          >
            <TableCell className='whitespace-nowrap px-2 py-3 font-medium'>
              {student.name}
            </TableCell>
            <TableCell className='px-2 py-3'>
              <div className='truncate text-sm text-muted-foreground'>
                {student.description || '한줄소개가 작성되지 않았습니다.'}
              </div>
            </TableCell>
            <TableCell className='whitespace-nowrap px-2 py-3'>
              <Badge variant='secondary' className='text-xs'>
                {student.department}
              </Badge>
            </TableCell>
            <TableCell className='py-3 text-sm text-muted-foreground'>
              <div className='max-w-xs truncate'>{student.email || '-'}</div>
            </TableCell>
            <TableCell className='py-3 text-sm'>
              <div className='max-w-xs truncate'>
                {student.dreamJob
                  ? `${student.dreamJob} 희망`
                  : '희망직무 없음'}
              </div>
            </TableCell>
            <TableCell className='whitespace-nowrap py-3 text-center text-sm text-muted-foreground'>
              {student.skills.length}개
            </TableCell>
            <TableCell className='whitespace-nowrap py-3 text-center text-sm text-muted-foreground'>
              {student.awards.length}건
            </TableCell>
            <TableCell className='whitespace-nowrap py-3 text-center text-sm text-muted-foreground'>
              {student.projects.length}개
            </TableCell>
            <TableCell className='whitespace-nowrap py-3 text-center text-sm text-muted-foreground'>
              {student.links.length}개
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
