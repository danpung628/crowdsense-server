# CrowdSense 구현 발표 - Gamma 입력용 텍스트

## 표지

```
CrowdSense 구현
9팀
팀장: 서성덕
풀스택 개발자: 노원우
발표자: 정일혁
```

## 본문

```
전체 실행 흐름 (구현 관점)
- 공공 API 호출 → 캐싱 → 히스토리 저장(옵션), 실패 시 캐시 폴백 → 없으면 에러
- Redis 실패 시 safe*가 null/false 반환, 서비스 계속
- 캐시 미스는 배치(최대 20개 병렬)로 채워넣음
---

공공 API 호출 세부
- timeout 10s, URL `/JSON/citydata_ppltn/1/5/{areaCode}`
- 응답에 area 매핑 붙여 payload 생성 후 캐싱
---

Redis 연결·사용
- connect timeout 2s, 실패 후 30s 슬로틀
- safeGet/safeSetEx/safeDel: 실패 시 null/false → 로직 지속
---

캐시 키 & 미스 처리
- 키 예시(1회): `crowd:{areaCode}`, `parking:{district}`, `subway:{areaCode}`
- 캐시 미스 POI 최대 20개 병렬 fetch, 개별 실패는 error 필드로 반환
---

프런트 재시도
- 3회, 1/2/4초 백오프, 5xx·네트워크만 재시도
- 타임아웃/Timedout 메시지 변환, 4xx는 즉시 실패
---

폴백·에러 응답
- 실패 시 캐시 폴백, 폴백 없으면 에러
- 에러 포맷: `{success:false, error, timestamp}` + HATEOAS 링크
---

히스토리 저장
- DynamoDB에 peopleCount·congestionLevel 저장
- 저장 실패 시 로그만, 메인 응답 유지
---

배포/레이어
- Lambda + Layer `/opt/nodejs/shared/...`
- 배포 스크립트가 `nodejs/shared` 구조 강제
---

리스크 대응(구현된 동작)
- 공공 API 장애: 캐시 폴백
- Redis 장애: safe*로 서비스 지속, 30s 후 재시도
- DynamoDB 장애: 히스토리 미저장 허용(로그만)
- Layer 구조 오류: 배포 스크립트로 강제 검증
---

데모 체크포인트
- 엔드포인트: `/areas/categories`, `/areas/category/{category}`, `/crowd`, `/crowd/{areaCode}`
- 확인: 캐시 히트/미스 로그, 공공 API 호출 여부, 폴백 발생 여부, 히스토리 저장 로그
```

## 이미지 생성 프롬프트 (제미나이용)

Three male teammates in a cute, friendly illustration style. One has long hair, one has ash-silver hair in a leaf-cut style, the third has short dark hair. They stand together in front of a futuristic Seoul night skyline with gentle smart-city/data grid glow. Soft colors, clean lines, warm mood, tech-y yet approachable.
