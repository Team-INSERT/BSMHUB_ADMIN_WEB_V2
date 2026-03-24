# DB 변경사항 (경력탭 군대/대학교 기능)

## 1. `military_service_statuses` — 시드 데이터 삽입 (필수)

복무 구분 드롭다운에 표시할 데이터가 없어서 선택 불가 상태.
아래 SQL을 실행해서 기본 복무 구분을 삽입해야 함.

```sql
INSERT INTO military_service_statuses (military_service_status_name) VALUES
  ('현역'),
  ('사회복무요원'),
  ('보충역'),
  ('전문연구요원'),
  ('산업기능요원'),
  ('공중보건의사'),
  ('면제');
```

---

## 2. `military_services` — PK 확인 및 설정

현재 타입 정의 기준으로 컬럼: `student_id`, `start_date`, `end_date`, `military_service_status_id`

별도의 `id` 컬럼이 없어서 PK가 어떻게 잡혀있는지 확인 필요.

**Supabase 대시보드 → Table Editor → `military_services` → 컬럼 확인**

### 케이스별 대응

**PK가 `student_id` 하나인 경우** (학생당 1개만 허용):
- 현재 코드에서 insert 시 학생당 복무 기록이 하나 초과하면 중복 에러 발생
- 여러 복무 기록을 허용하려면 아래처럼 복합 PK로 변경 권장

```sql
-- 기존 PK 삭제 후 복합 PK 설정
ALTER TABLE military_services DROP CONSTRAINT military_services_pkey;
ALTER TABLE military_services ADD PRIMARY KEY (student_id, start_date);
```

**PK가 이미 `(student_id, start_date)` 복합인 경우**: 변경 불필요

---

## 3. `student_universities` — PK 확인

컬럼: `student_id`, `university_id`, `created_at`

마찬가지로 PK 확인 필요.

**권장 PK: `(student_id, university_id)`**

```sql
-- PK가 다른 경우 변경
ALTER TABLE student_universities DROP CONSTRAINT student_universities_pkey;
ALTER TABLE student_universities ADD PRIMARY KEY (student_id, university_id);
```

---

## 4. RLS 정책 확인

아래 테이블들에 web admin이 읽기/쓰기 가능한지 확인.

**Supabase 대시보드 → Authentication → Policies**

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `military_service_statuses` | ✅ 필요 | ❌ 불필요 | ❌ 불필요 | ❌ 불필요 |
| `military_services` | ✅ 필요 | ✅ 필요 | ✅ 필요 | ✅ 필요 |
| `universities` | ✅ 필요 | ✅ 필요 | ❌ 불필요 | ❌ 불필요 |
| `student_universities` | ✅ 필요 | ✅ 필요 | ❌ 불필요 | ✅ 필요 |

RLS가 활성화되어 있고 정책이 없으면 모든 쿼리가 빈 결과 또는 403 반환.

**임시 확인용 (개발 환경에서만):**
```sql
-- 각 테이블에 모든 접근 허용 정책 추가 (프로덕션에서는 적절히 제한)
CREATE POLICY "allow all" ON military_service_statuses FOR ALL USING (true);
CREATE POLICY "allow all" ON military_services FOR ALL USING (true);
CREATE POLICY "allow all" ON universities FOR ALL USING (true);
CREATE POLICY "allow all" ON student_universities FOR ALL USING (true);
```

---

## 우선순위

1. **`military_service_statuses` 시드 데이터 삽입** → 복무 구분 드롭다운이 비어있는 직접적인 원인
2. **RLS 정책 확인** → SELECT 권한 없으면 시드 데이터 삽입해도 빈 목록
3. **PK 확인** → insert 에러 발생 시 대응
