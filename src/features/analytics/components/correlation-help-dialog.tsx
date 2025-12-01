import { useState } from 'react'
import { IconHelp } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function CorrelationHelpDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => setOpen(true)}
        className='h-8 w-8 p-0'
        title='상관관계 분석 도움말'
      >
        <IconHelp className='h-4 w-4' />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[80vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>상관관계 분석 도움말</DialogTitle>
            <DialogDescription>
              상관관계 분석을 이해하고 활용하는 방법
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue='understanding' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='understanding'>개념</TabsTrigger>
              <TabsTrigger value='metrics'>지표</TabsTrigger>
              <TabsTrigger value='usage'>사용법</TabsTrigger>
            </TabsList>

            <TabsContent value='understanding' className='space-y-4'>
              <div className='space-y-3'>
                <h3 className='font-semibold'>상관관계란?</h3>
                <p className='text-sm text-muted-foreground'>
                  상관관계는 두 변수가 서로 어떤 정도로 함께 변하는지를 나타내는
                  통계 지표입니다. 예를 들어, 특정 자격증 취득이 취업과 어느
                  정도 관련이 있는지 알 수 있습니다.
                </p>
              </div>

              <div className='space-y-3 rounded-lg bg-muted/30 p-3'>
                <h3 className='font-semibold'>
                  피어슨 계수 (Pearson Coefficient)
                </h3>
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>두 변수 간 선형관계의 강도와 방향을 나타냅니다.</p>
                  <div className='ml-2 space-y-1'>
                    <p>
                      <Badge variant='outline' className='mr-2'>
                        +1에 가까움
                      </Badge>
                      강한 양의 상관 (함께 증가)
                    </p>
                    <p>
                      <Badge variant='outline' className='mr-2'>
                        0 근처
                      </Badge>
                      거의 관계 없음
                    </p>
                    <p>
                      <Badge variant='outline' className='mr-2'>
                        -1에 가까움
                      </Badge>
                      강한 음의 상관 (반대 방향)
                    </p>
                  </div>
                </div>
              </div>

              <div className='space-y-3 rounded-lg bg-muted/30 p-3'>
                <h3 className='font-semibold'>Absolute 값</h3>
                <p className='text-sm text-muted-foreground'>
                  상관계수의 절댓값입니다. 부호(양/음)를 무시하고 상관관계의
                  강도만 비교할 때 사용합니다. 상위 피처를 찾을 때 주로 이
                  값으로 정렬됩니다.
                </p>
              </div>
            </TabsContent>

            <TabsContent value='metrics' className='space-y-4'>
              <div className='space-y-3'>
                <h3 className='font-semibold'>분석 탭별 의미</h3>

                <div className='space-y-3 rounded-lg border p-3'>
                  <div>
                    <p className='text-sm font-medium'>전체 피처</p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      DB에 입력된 모든 피처와 취업 간의 상관계수입니다.
                      <br />
                      모델이 학습하는 전체 요인들의 중요도를 파악할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className='space-y-3 rounded-lg border p-3'>
                  <div>
                    <p className='text-sm font-medium'>자격증명</p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      자격증의 종류와 취업 간의 상관계수입니다.
                      <br />
                      취업에 영향을 미치는 자격증을 파악할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className='space-y-3 rounded-lg border p-3'>
                  <div>
                    <p className='text-sm font-medium'>자격증 취득일</p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      정보처리산업기사를 언제 취득했는지와 취업 간의
                      상관계수입니다.
                      <br />
                      조기 취득이 취업에 미치는 영향을 볼 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className='space-y-3 rounded-lg border p-3'>
                  <div>
                    <p className='text-sm font-medium'>수상명</p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      수상 실적과 취업 간의 상관계수입니다.
                      <br />
                      어떤 수상이 취업과 가장 관련이 있는지 파악할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className='space-y-3 rounded-lg border p-3'>
                  <div>
                    <p className='text-sm font-medium'>과목별 성적</p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      각 과목의 성적과 취업 간의 상관계수입니다.
                      <br />
                      어떤 과목이 취업과 가장 관련이 있는지 알 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className='space-y-3 rounded-lg bg-muted/30 p-3'>
                <h3 className='text-sm font-semibold'>통계 정보</h3>
                <div className='space-y-2 text-xs text-muted-foreground'>
                  <p>
                    <span className='font-medium'>사용 행</span>: 분석에 사용된
                    학생 수
                  </p>
                  <p>
                    <span className='font-medium'>분석 피처 수</span>: 분석된
                    특징량의 개수
                  </p>
                  <p>
                    <span className='font-medium'>Rows/Samples</span>: 각 항목이
                    포함된 학생 수
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value='usage' className='space-y-4'>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <h3 className='font-semibold'>1단계: 데이터 선택</h3>
                  <p className='text-sm text-muted-foreground'>
                    "전체 기수" 또는 "특정 기수"를 선택하여 분석 범위를
                    지정합니다. 특정 기수를 선택하면 해당 기수만의 상관관계를 볼
                    수 있습니다.
                  </p>
                </div>

                <div className='space-y-2'>
                  <h3 className='font-semibold'>2단계: 분석 새로고침</h3>
                  <p className='text-sm text-muted-foreground'>
                    "분석 새로고침" 버튼을 클릭하여 선택한 데이터의 상관관계를
                    분석합니다.
                  </p>
                </div>

                <div className='space-y-2'>
                  <h3 className='font-semibold'>3단계: 결과 해석</h3>
                  <ul className='ml-4 list-disc space-y-1 text-sm text-muted-foreground'>
                    <li>
                      <span className='font-medium'>파란 막대</span>: 절댓값
                      상관계수 (강도만 표시)
                    </li>
                    <li>
                      <span className='font-medium'>파란색</span>: 양의 상관
                      (함께 증가)
                    </li>
                    <li>
                      <span className='font-medium'>빨간색</span>: 음의 상관
                      (반대 방향)
                    </li>
                  </ul>
                </div>

                <div className='space-y-2'>
                  <h3 className='font-semibold'>4단계: 상세 탭 확인</h3>
                  <p className='text-sm text-muted-foreground'>
                    각 탭을 클릭하여 분야별 상관관계를 자세히 살펴봅니다.
                    테이블에서 정렬된 전체 데이터를 확인할 수 있습니다.
                  </p>
                </div>

                <div className='mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950'>
                  <p className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                    💡 팁: 상관계수가 0에 가까울수록 그 요인이 취업에 거의
                    영향을 주지 않는다는 의미입니다. 높은 상관계수를 가진
                    요인들에 주목하세요.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
