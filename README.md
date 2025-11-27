# Pomofomo

뽀모도로를 기본으로, 공부/업무 시간을 더 선명하게 기록하고 리포트로 확인할 수 있는 웹 타이머입니다.  
라이브 서비스: https://pomofomo.vercel.app

## 주요 기능
- 뽀모도로 타이머·스톱워치 전환, 사이클 자동 전환(집중/짧은·긴 휴식) 및 프리셋 시간 버튼
- 집중 시간 저장 시 태스크 선택·입력 후 Supabase에 기록, 최근 5개 히스토리 확인·수정·삭제
- 주/월/년 단위 리포트(막대 차트)와 태스크별 집중 시간 분포 조회
- 구글 OAuth 로그인으로 기기 간 설정·기록 동기화, 비로그인 시 로컬 저장
- 다크 모드, 로컬 상태/설정 복원, PWA 설정(모바일 홈 화면 추가 가능)

## 기술 스택
- Framework: Next.js 16 (App Router) + TypeScript
- UI: Tailwind CSS 4, React Hot Toast
- 데이터/인증: Supabase (Auth + Postgres)
- 기타: date-fns, Recharts



## 배포
- Vercel에 `NEXT_PUBLIC_SUPABASE_*` 환경 변수를 추가하고 `npm run build`를 빌드 명령으로 설정합니다.

## 라이선스
별도 명시가 없으므로 개인 용도로만 사용하세요. 필요 시 저장소 라이선스를 확인해 주세요.
