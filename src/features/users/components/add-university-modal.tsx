import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type NewUniversity = {
  university_id: number
  university_name: string
  university_department: string | null
}

type AddUniversityModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (newUniv: NewUniversity) => void
}

export function AddUniversityModal({
  open,
  onOpenChange,
  onSuccess,
}: AddUniversityModalProps) {
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    const trimmedDepartment = department.trim()

    if (!trimmedName) {
      toast({
        variant: 'destructive',
        title: '대학교명을 입력해주세요.',
      })
      return
    }
    setIsSubmitting(true)
    try {
      let existingQuery = supabase
        .from('universities')
        .select('university_id, university_name, university_department')
        .eq('university_name', trimmedName)

      if (trimmedDepartment) {
        existingQuery = existingQuery.eq(
          'university_department',
          trimmedDepartment
        )
      } else {
        existingQuery = existingQuery.is('university_department', null)
      }

      const { data: existing } = await existingQuery.maybeSingle()

      if (existing) {
        onSuccess?.(existing)
        onOpenChange(false)
        setName('')
        setDepartment('')
        return
      }

      const { data: inserted, error } = await supabase
        .from('universities')
        .insert([
          {
            university_name: trimmedName,
            university_department: trimmedDepartment || null,
          },
        ])
        .select('university_id, university_name, university_department')
        .single()

      if (error) {
        // unique constraint 위반 → 이미 존재하는 레코드를 다시 조회
        if (error.code === '23505') {
          let fallbackQuery = supabase
            .from('universities')
            .select('university_id, university_name, university_department')
            .eq('university_name', trimmedName)

          if (trimmedDepartment) {
            fallbackQuery = fallbackQuery.eq(
              'university_department',
              trimmedDepartment
            )
          } else {
            fallbackQuery = fallbackQuery.is('university_department', null)
          }

          const { data: fallback, error: fetchError } =
            await fallbackQuery.single()
          if (fetchError) throw new Error(fetchError.message)
          if (!fallback) throw new Error('대학교 정보를 찾을 수 없습니다.')
          onSuccess?.(fallback)
          onOpenChange(false)
          setName('')
          setDepartment('')
          return
        }
        throw new Error(error.message)
      }
      if (!inserted) throw new Error('대학교 정보를 생성할 수 없습니다.')

      await queryClient.invalidateQueries({ queryKey: ['universities'] })
      toast({ title: '대학교가 추가되었습니다.' })
      onSuccess?.(inserted)
      onOpenChange(false)
      setName('')
      setDepartment('')
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '추가에 실패했습니다.',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>새 대학교 추가</DialogTitle>
          <DialogDescription>
            새로운 대학교 정보를 입력하세요. 학과명은 선택입니다.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-1.5'>
            <Label>대학교명</Label>
            <Input
              placeholder='예: 부산대학교'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='space-y-1.5'>
            <Label>학과명 (선택)</Label>
            <Input
              placeholder='예: 컴퓨터공학과'
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '추가 중...' : '추가하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
