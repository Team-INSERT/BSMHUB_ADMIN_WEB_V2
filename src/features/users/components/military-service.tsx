import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
// import { Input } from "@/components/ui/input";
import { useEditUser } from '../context/edit-context'
import { UserDetailType } from '../data/schema'

export const MilitaryService = ({
  datas,
}: {
  datas: UserDetailType['military_services']
}) => {
  const { editingSection } = useEditUser()
  const militaryServiceData = datas && datas.length > 0 ? datas[0] : null

  const militaryStatus = () => {
    if (militaryServiceData) {
      const nowDate = new Date()
      const militaryStartDate = new Date(militaryServiceData.start_date)
      const militaryEndDate = new Date(militaryServiceData.end_date ?? '')

      if (militaryStartDate <= nowDate && nowDate <= militaryEndDate)
        return '복무 중'
      else if (nowDate <= militaryStartDate) return '미완료'
      else if (nowDate >= militaryEndDate) return '완료'
    } else {
      return '미완료'
    }
  }

  const studentMilitaryStatus = militaryStatus()

  return (
    <div>
      {editingSection === 'military' ? (
        <div className='space-y-4'>
          <div className='flex items-center gap-4'>
            <Label
              htmlFor='militaryCompleted'
              className='flex items-center gap-2'
            >
              <Checkbox
                id='militaryCompleted'
                // checked={editData.militaryService?.completed}
                onCheckedChange={() => {}}
              />
              병역여부
            </Label>
          </div>

          {/* {editData.militaryService?.completed && (
          <div className="space-y-2">
            <Label>복무기간</Label>
            <Input
              value={editData.militaryService?.duration || ""}
              onChange={(e) =>
                handleInputChange(
                  "militaryService.duration",
                  e.target.value
                )
              }
              placeholder="예: 18개월"
            />
          </div>
        )} */}
        </div>
      ) : militaryServiceData ? (
        <dl className='space-y-2'>
          <div className='flex gap-2'>
            <dt className='w-24 flex-shrink-0 font-medium'>병역여부:</dt>
            <dd>{studentMilitaryStatus}</dd>
          </div>
          {militaryServiceData.start_date && (
            <>
              <div className='flex gap-2'>
                <dt className='w-24 flex-shrink-0 font-medium'>복무 기간:</dt>
                <dd>{militaryServiceData.start_date}</dd> ~{' '}
                <dd>{militaryServiceData.end_date ?? '-'}</dd>
              </div>
              <div className='flex gap-2'>
                <dt className='w-24 flex-shrink-0 font-medium'>복무 형태:</dt>
                <dd>
                  {
                    militaryServiceData.military_service_statuses
                      .military_service_status_name
                  }
                </dd>
              </div>
            </>
          )}
        </dl>
      ) : (
        <>
          <dt className='w-26 flex-shrink-0 font-medium'>병역여부: 미완료</dt>
        </>
      )}
    </div>
  )
}
