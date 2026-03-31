import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AddUniversityModal, NewUniversity } from './add-university-modal'

type AddUniversityOptionProps = {
  onSuccess?: (newUniv: NewUniversity) => void
}

export const AddUniversityOption = ({ onSuccess }: AddUniversityOptionProps) => {
  const [modalOpen, setModalOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setModalOpen(true)
  }

  return (
    <>
      <div className='mt-1 border-t px-2 py-2'>
        <Button
          variant='ghost'
          size='sm'
          className='flex w-full items-center justify-start text-sm'
          onClick={handleClick}
        >
          <span className='mr-1'>+</span>
          새 대학교 추가하기
        </Button>
      </div>
      <AddUniversityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={onSuccess}
      />
    </>
  )
}
