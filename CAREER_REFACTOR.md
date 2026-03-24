# 경력탭 리팩토링 계획

## 현황 파악

경력탭은 현재 4가지 카드 컴포넌트로 구성되어 있다.

| 컴포넌트 | 색상 | 기능 |
|---|---|---|
| `EmploymentCard` | 파란색 | 취업 이력 표시/수정/삭제/퇴직처리 |
| `FieldTrainingCard` | 초록색 | 현장실습 표시/수정/삭제 |
| `MilitaryServiceCard` | 보라색 | 군복무 표시/수정/삭제 |
| `UniversityCard` | 주황색 | 대학교 표시/삭제 |

---

## 문제 목록

### 1. 퇴직 사유가 저장되지 않음 (버그)

**위치**: `employment-card.tsx` → `handleEnd()`

**현상**: `ReasonSelect` 컴포넌트로 퇴직 사유를 선택받지만, `empMutate` 호출 시 사유 필드가 포함되지 않음.

```ts
// 현재 handleEnd - endReason, endReasonEtc 상태가 있지만 사용 안 됨
await empMutate([{
  action: 'update',
  datas: {
    employment_companies: {
      student_id: studentId,
      company_id: emp.company_id,
      job_id: emp.job_id,
      original_start_date: emp.start_date,
      start_date: emp.start_date,
      end_date: toDateStr(endDate),
      // ← resignation_reason 없음
    },
  },
}])
```

**원인**: `employment_companies` 테이블에 `resignation_reason` 컬럼이 없음.

**해결 방법**:

1. DB 컬럼 추가
```sql
ALTER TABLE employment_companies
  ADD COLUMN resignation_reason TEXT;
```

2. `handleEnd`에서 사유 포함
```ts
end_date: toDateStr(endDate),
resignation_reason: endReason === '기타' ? endReasonEtc : endReason || null,
```

3. `employment_companies` 타입에 컬럼이 반영되어 있는지 확인 (Supabase 타입 재생성 필요)

---

### 2. 퇴직 사유가 카드에 표시되지 않음

**위치**: `employment-card.tsx` 요약 뷰 (접힌 상태)

**현상**: 퇴직 처리된 카드에 사유가 보이지 않음. DB에 사유가 있어도 읽어서 표시하지 않음.

**해결 방법**:

`emp.resignation_reason`이 있으면 퇴직 Badge 옆에 사유 표시 추가.

```tsx
{emp.end_date && (
  <Badge variant='outline'>
    퇴직{emp.resignation_reason ? ` · ${emp.resignation_reason}` : ''}
  </Badge>
)}
```

---

### 3. 퇴직된 카드에서 퇴직일 수정 불가

**위치**: `employment-card.tsx`

**현상**: 이미 퇴직한 경우(`emp.end_date` 있음) 카드를 열면 입사일 달력만 나오고 퇴직일을 변경할 방법이 없음. "저장하면 퇴직일이 초기화되어 재직 중으로 변경됩니다"라는 안내만 있음.

**현재 동작**:
- `!emp.end_date`일 때만 "퇴직 처리" 버튼 노출
- 퇴직 상태에서 입사일 달력 저장 → `dateRange.to`가 `undefined` → `end_date: null` → 의도치 않은 복직 처리

**해결 방법**:

퇴직 상태 카드 편집 영역을 두 섹션으로 분리.

```
[재직 중인 카드]
- 입사일 달력
- 취업 직무
- [퇴직 처리] 버튼

[퇴직된 카드]
- 입사일 달력
- 취업 직무
- 퇴직일 달력 (수정 가능)
- 퇴직 사유 (수정 가능)
- [복직 처리] 버튼 (end_date를 null로)
- [저장] 버튼 (퇴직일/사유만 업데이트)
```

---

### 4. 복직 처리 UX가 불명확함

**위치**: `employment-card.tsx`

**현상**: 복직하려면 "카드를 열고 저장"하라는 텍스트 안내만 있음. 명시적인 복직 버튼 없음.

**해결 방법**:

퇴직 상태의 카드에 명시적인 [복직 처리] 버튼 추가.

```ts
const handleRestore = async () => {
  await empMutate([{
    action: 'update',
    datas: {
      employment_companies: {
        ...
        end_date: null,
        resignation_reason: null,
      },
    },
  }])
}
```

---

### 5. UniversityCard 수정 기능 없음

**위치**: `university-card.tsx`

**현상**: 대학교 카드는 삭제 버튼만 있고 대학명/학과명 수정이 불가능함.

**해결 방법**:

`EmploymentCard`/`MilitaryServiceCard`처럼 expand 패턴 적용.

```
[접힌 상태]
- 대학교명 / 학과명 / [삭제]

[펼친 상태]
- 대학교명 Input
- 학과명 Input
- [삭제] [취소] [저장]
```

단, `universities` 테이블은 공유 테이블(다른 학생도 참조 가능)이므로 수정 방식에 주의.
- `student_universities` 관계만 바꾸는 방식(기존 대학 삭제 후 새 대학 연결)이 안전함.

---

### 6. `applyOverlaps` 로직 중복

**위치**: `add-career-card.tsx`, `employment-card.tsx`, `field-training-card.tsx`

**현상**: 겹침 조정 로직(`applyOverlapsAndAdd`, `applyOverlapsAndSave`)이 각 카드에 거의 동일하게 복사되어 있음.

```ts
// add-career-card.tsx 와 employment-card.tsx 에 거의 동일한 코드가 존재
for (const overlap of overlaps) {
  const adj = overlap.adjustment
  if (overlap.type === 'field_training') {
    if (adj.kind === 'trim-end') { await ftMutate([...]) }
    else if (adj.kind === 'push-start') { await ftMutate([...]) }
  } else {
    if (adj.kind === 'trim-end') { await empMutate([...]) }
    else if (adj.kind === 'push-start') { await empMutate([...]) }
  }
}
```

**해결 방법**:

`career-overlap.ts` 또는 별도 훅으로 추출.

```ts
// useApplyOverlaps 훅
export function useApplyOverlaps(studentId: string) {
  const { mutateAsync: ftMutate } = useHandleFieldTrainingMutation()
  const { mutateAsync: empMutate } = useHandleEmploymentMutation()

  const applyOverlaps = async (overlaps: OverlapTarget[]) => { ... }

  return { applyOverlaps }
}
```

---

## 작업 우선순위

| 순위 | 항목 | 난이도 | DB 변경 필요 |
|---|---|---|---|
| 1 | 퇴직 사유 저장 (버그 수정) | 중 | ✅ `resignation_reason` 컬럼 추가 |
| 2 | 퇴직 사유 카드 표시 | 하 | ❌ |
| 3 | 퇴직된 카드 퇴직일 수정 + 복직 버튼 | 중 | ❌ |
| 4 | UniversityCard 수정 기능 | 중 | ❌ |
| 5 | applyOverlaps 로직 공통화 | 중 | ❌ |

---

## DB 변경사항 요약

```sql
-- employment_companies 테이블에 퇴직 사유 컬럼 추가
ALTER TABLE employment_companies
  ADD COLUMN resignation_reason TEXT;
```

Supabase 타입 재생성 필요:
```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > src/utils/supabase/database.types.ts
```
