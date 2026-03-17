import { Badge } from '@/components/ui/badge'
import { UserDetailType } from '../data/schema'

export const StudentCertificates = ({
  datas,
}: {
  datas: UserDetailType['student_certificates']
}) => {
  return (
    <div className='flex flex-wrap gap-1'>
      {datas.length > 0
        ? datas.map((item) => (
            <Badge key={item.certificates.certificate_id}>
              {item.certificates.certificate_name ?? '-'}
            </Badge>
          ))
        : '-'}
    </div>
  )
}
