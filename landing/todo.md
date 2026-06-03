# BCB Labs 자동응대 웹앱 TODO

## DB 스키마
- [x] leads 테이블 정의 (id, createdAt, email, company, useCase, dataType, avgPacketSize, packetsPerSec, deviceCount, networkType, dataPricePerGb, ratioUsed, savingsPct, monthlySaved, monthlyCostSaved, hwNote, lang, status, clickedAt)
- [x] pnpm db:push 로 마이그레이션 적용

## 백엔드 - 절약액 계산 로직
- [x] data_type별 압축비 테이블 + 선형 보간 함수
- [x] use_case → data_type 매핑 (data_type 미지정 시)
- [x] BCB 우위 한계 처리 + 안내 플래그
- [x] 대역폭/요금/하드웨어 절감 계산 (savings_pct, monthly_saved, monthly_cost_saved, hw_note)
- [x] 계산 로직 단위 테스트 (테스트 케이스 A~E)

## 백엔드 - 리드 처리 API (오너 알림 방식)
- [x] submitLead 프로시저: 입력 검증 → 계산 → DB 저장(status=new) → 오너 알림(notifyOwner) → status=notified
- [x] 오너 알림 내용: 이메일, 제출 시각, 언어, 계산 결과 포함
- [x] getResult 프로시저: 리드 id로 계산 결과 조회 (확인 페이지용, EN/KO별 문구 반환)
- [x] requestConsult 프로시저(/lead?id=): status=interested, clickedAt 기록, 오너 상담요청 알림

## 백엔드 - 테스트
- [x] 계산 로직 vitest (12 tests pass)
- [x] submitLead 프로시저 vitest
- [x] lead 클릭 처리 vitest

## 프론트엔드 - 랜딩페이지
- [x] 기존 랜딩페이지 디자인 재현 (아이보리, Fraunces/Hanken Grotesk, 섹션 구조)
- [x] EN/KO 언어 전환 (푸터 토글 + localStorage + URL ?lang)
- [x] 문의 폼: 이메일 + 추가 입력(용도, 데이터종류, 패킷 크기, 초당 패킷수, 네트워크) → submitLead 호출
- [x] 폼 제출 후 /lead 결과 페이지로 이동
- [x] /lead 확인 페이지 (예상 절감 결과 + 도입 상담 받기 버튼, KO/EN)

## 마무리
- [x] 전체 플로우 검증: KO 실플로우(제출→계산→상담요청→status=interested) + EN 실플로우(game/rpc, 3.54×, status=interested) 모두 DB 확인, 18 tests pass
- [x] 오너 알림: submit(line111)·requestConsult(line205) 모두 notifyOwner 호출 코드 근거 확인
- [ ] 체크포인트 저장
- [ ] GitHub 저장소 푸시
