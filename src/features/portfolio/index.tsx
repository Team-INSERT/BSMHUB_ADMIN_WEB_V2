import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PortfolioPanel } from '@/components/layout/portfolio-panel'
import Loader from '@/components/loader'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PortfolioFilters } from './components/portfolio-filters'
import { StudentCard } from './components/student-card'
import { StudentTable } from './components/student-table'
import { useAllStudents } from './hooks/use-all-students.ts'

export default function Portfolio() {
  const { data: students, isLoading } = useAllStudents()
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [dreamJobFilter, setDreamJobFilter] = useState('all')
  const [generationFilter, setGenerationFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleStudentClick = (studentId: string) => {
    setSelectedStudentId(studentId)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setTimeout(() => setSelectedStudentId(null), 200)
  }

  // Get unique departments
  const departments = useMemo((): string[] => {
    if (!students) return []
    return Array.from(
      new Set(students.map((s: { department: string }) => s.department))
    ).sort() as string[]
  }, [students])

  // Get unique dream jobs
  const dreamJobs = useMemo((): string[] => {
    if (!students) return []
    const allJobs = students
      .flatMap(
        (s: { dreamJob: string | null }) => s.dreamJob?.split(', ') || []
      )
      .filter(Boolean) as string[]
    return Array.from(new Set(allJobs)).sort() as string[]
  }, [students])

  // Get unique generations
  const generations = useMemo((): number[] => {
    if (!students) return []
    return [...new Set(students.map((s) => s.generation).filter(Boolean))].sort((a, b) => b - a)
  }, [students])

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!students) return []

    return students.filter((student) => {
      if (departmentFilter !== 'all' && student.department !== departmentFilter) return false
      if (dreamJobFilter !== 'all' && !student.dreamJob?.includes(dreamJobFilter)) return false
      if (generationFilter !== 'all' && student.generation?.toString() !== generationFilter) return false

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return [
          student.name,
          student.email,
          student.dreamJob,
          ...student.skills.map((s) => s.skill_name)
        ].some((field) => field?.toLowerCase().includes(query))
      }

      return true
    })
  }, [students, searchQuery, departmentFilter, dreamJobFilter, generationFilter])

  // Sort students
  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents]

    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'recent') {
      // Assuming students array is already in order from database
      // If you have a created_at field, you can sort by that
      sorted.reverse()
    }

    return sorted
  }, [filteredStudents, sortBy])

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold tracking-tight'>학생 포트폴리오</h2>
          <p className='text-muted-foreground'>
            모든 학생들의 포트폴리오 정보를 확인할 수 있습니다.
          </p>
        </div>

        <div className='mb-6'>
          <PortfolioFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            departmentFilter={departmentFilter}
            onDepartmentChange={setDepartmentFilter}
            departments={departments}
            dreamJobFilter={dreamJobFilter}
            onDreamJobChange={setDreamJobFilter}
            dreamJobs={dreamJobs}
            generationFilter={generationFilter}
            onGenerationChange={setGenerationFilter}
            generations={generations}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {isLoading ? (
          <Loader />
        ) : !students || students.length === 0 ? (
          <div className='rounded-lg border bg-card p-8 text-center'>
            <p className='text-muted-foreground'>등록된 학생이 없습니다.</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className='rounded-lg border bg-card p-8 text-center'>
            <p className='text-muted-foreground'>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className='mb-4 text-sm text-muted-foreground'>
              총 {sortedStudents.length}명의 학생
            </div>
            {viewMode === 'grid' ? (
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {sortedStudents.map((student) => (
                  <StudentCard
                    key={student.student_id}
                    name={student.name}
                    description={student.description ?? null}
                    email={student.email}
                    department={student.department}
                    dreamJob={student.dreamJob}
                    skills={student.skills}
                    awards={student.awards}
                    projects={student.projects}
                    links={student.links}
                    onClick={() => handleStudentClick(student.student_id)}
                  />
                ))}
              </div>
            ) : (
              <StudentTable
                students={sortedStudents}
                onStudentClick={handleStudentClick}
              />
            )}
          </>
        )}
      </Main>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className='max-h-[90vh] max-w-2xl overflow-auto'>
          <DialogHeader>
            <DialogTitle>학생 포트폴리오</DialogTitle>
          </DialogHeader>
          {selectedStudentId && (
            <PortfolioPanel studentId={selectedStudentId} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
