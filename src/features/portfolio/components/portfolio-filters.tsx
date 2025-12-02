import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, ArrowUpDown, Grid3x3, List } from 'lucide-react'

type PortfolioFiltersProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  departmentFilter: string
  onDepartmentChange: (value: string) => void
  departments: string[]
  dreamJobFilter: string
  onDreamJobChange: (value: string) => void
  dreamJobs: string[]
  generationFilter: string
  onGenerationChange: (value: string) => void
  generations: number[]
  sortBy: string
  onSortChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export const PortfolioFilters = ({
  searchQuery,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  departments,
  dreamJobFilter,
  onDreamJobChange,
  dreamJobs,
  generationFilter,
  onGenerationChange,
  generations,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: PortfolioFiltersProps) => (
  <div className="space-y-4">
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="학생 이름, 이메일, 기술 스택 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">필터:</span>
      </div>
      
      <Select value={departmentFilter} onValueChange={onDepartmentChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="전체 학과" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 학과</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={dreamJobFilter} onValueChange={onDreamJobChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="희망 직무" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 직무</SelectItem>
          {dreamJobs.map((job) => (
            <SelectItem key={job} value={job}>
              {job}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={generationFilter} onValueChange={onGenerationChange}>
        <SelectTrigger className="w-full sm:w-32">
          <SelectValue placeholder="기수" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 기수</SelectItem>
          {generations.map((gen) => (
            <SelectItem key={gen} value={gen.toString()}>
              {gen}기
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 sm:ml-auto">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">가나다순</SelectItem>
            <SelectItem value="recent">하늘순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onViewModeChange('grid')}
          aria-label="그리드 뷰"
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onViewModeChange('list')}
          aria-label="리스트 뷰"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
)
