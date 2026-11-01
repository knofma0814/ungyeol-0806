# 운결 AI 상담 서버 연결 안내

GitHub Pages의 운결 화면에는 운명술사 상담 UI가 추가되어 있습니다. 브라우저에 API 키를 넣지 않도록 별도 서버가 필요합니다. `ai-worker.js`는 Cloudflare Workers용 중계 서버이며 OpenAI-compatible Chat Completions API를 제공하는 LLM 서비스와 연결할 수 있습니다.

## 1. 준비
- Cloudflare 계정 및 Workers 사용 권한
- 사용할 LLM 제공자의 API 키
- 제공자의 Chat Completions 호환 API 전체 주소와 모델 ID

## 2. Worker 배포
저장소를 내려받은 프로젝트 폴더에서 실행합니다.

```bash
npm install -D wrangler
npx wrangler login
npx wrangler deploy ai-worker.js --name ungyeol-ai
```

배포 후 `https://ungyeol-ai.<계정>.workers.dev` 주소를 확인합니다.

## 3. Worker 환경 변수 설정
Cloudflare 대시보드의 Worker Settings → Variables에 다음 값을 등록합니다.
- `LLM_API_URL`: 제공자의 Chat Completions API 전체 주소
- `LLM_MODEL`: 제공자가 지원하는 모델 ID
- `ALLOWED_ORIGIN`: `https://knofma0814.github.io`

API 키는 반드시 Secret으로 등록합니다.

```bash
npx wrangler secret put LLM_API_KEY
```

`LLM_API_URL`은 제공자가 안내하는 OpenAI-compatible `/chat/completions` 주소여야 합니다. 제공자마다 주소와 모델명이 다르므로 공식 문서를 확인하세요.

## 4. 운결에서 연결
운결을 새로고침한 뒤 ‘AI 상담 서버 주소’에 Worker 주소를 입력합니다. 예:

```
https://ungyeol-ai.<계정>.workers.dev
```

주소는 현재 브라우저 화면에서만 유지됩니다. 사주를 계산한 뒤 질문을 보내면 계산된 원국·강약·조후·격국·용신 후보·대운 요약이 상담 문맥으로 전달됩니다.

## 보안 및 현재 범위
- API 키는 Worker Secret에만 보관하며 GitHub 저장소와 브라우저로 보내지 않습니다.
- 출생일시 원문 대신 계산된 사주 기둥과 분석 요약을 전송합니다.
- 앱과 Worker 코드에는 대화 저장 기능이 없습니다. LLM 제공자의 데이터 처리·보관 정책은 별도로 확인해야 합니다.
- CORS 허용 출처는 운결 GitHub Pages 주소로 제한합니다. 다만 CORS만으로 외부의 직접 호출이나 비용 남용을 막을 수는 없습니다. 공개 운영 전 Cloudflare Rate Limiting, 사용량 한도, 봇 방지 등을 추가하세요.
- Worker는 OpenAI-compatible Chat Completions 형식을 전제로 합니다. 다른 형식의 제공자는 중계 코드 수정이 필요합니다.
- 이 저장소 변경만으로 AI 서버가 자동 배포되거나 API 키가 설정되지는 않습니다. 위 연결 절차가 끝나야 실제 AI 답변이 작동합니다.
