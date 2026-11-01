# 운결 AI 상담 서버 연결 안내

운결의 운명술사 상담은 **Cloudflare Workers 무료 플랜 + Google Gemini API 무료 등급**으로 연결할 수 있도록 구성되어 있습니다. 무료 등급에는 모델별 사용량 제한이 있으며, 제한을 넘으면 잠시 요청이 막힐 수 있습니다.

## 1. Google Gemini API 키 만들기
1. [Google AI Studio](https://aistudio.google.com/app/apikey)에 Google 계정으로 로그인합니다.
2. API key 만들기를 선택하고 키를 생성합니다.
3. 키를 GitHub 저장소나 운결 웹페이지에 입력하지 마세요. 다음 단계에서 Cloudflare Secret으로만 등록합니다.

기본 모델은 `gemini-2.5-flash-lite`입니다. Google AI Studio의 무료 등급에서 사용 가능한 모델이며, 모델별 무료 요청 한도는 계정·프로젝트 상태에 따라 달라질 수 있습니다.

## 2. Cloudflare 무료 Worker 만들기
1. [Cloudflare 대시보드](https://dash.cloudflare.com/)에 가입하거나 로그인합니다.
2. Workers & Pages에서 새 Worker를 만듭니다.
3. Worker 이름을 `ungyeol-ai`로 정하고 생성합니다.
4. 코드 편집 화면에서 이 저장소의 `ai-worker.js` 전체 내용을 붙여넣고 Deploy를 누릅니다.
5. 배포된 주소를 확인합니다. 예: `https://ungyeol-ai.<계정>.workers.dev`

Cloudflare Workers 무료 플랜의 요청 한도는 현재 하루 100,000회입니다. 무료 플랜 한도와 조건은 변경될 수 있으니 [공식 제한 안내](https://developers.cloudflare.com/workers/platform/limits/)를 확인하세요.

## 3. Worker 변수와 Secret 등록
Worker의 Settings → Variables and Secrets에서 다음 항목을 등록합니다.

일반 변수:
- `ALLOWED_ORIGIN`: `https://knofma0814.github.io`
- `GEMINI_MODEL`: `gemini-2.5-flash-lite` (생략해도 기본값 사용)

Secret:
- 이름: `GEMINI_API_KEY`
- 값: 1단계에서 발급한 Google AI Studio API 키

Secret으로 저장한 뒤 Worker를 다시 배포하거나 변경사항을 저장합니다. API 키는 일반 변수나 코드에 넣지 마세요.

## 4. 운결에서 연결
운결을 열고 ‘AI 상담 서버 주소’에 Worker 주소를 입력합니다.

```
https://ungyeol-ai.<계정>.workers.dev
```

주소 입력 후 사주를 계산하고 운명술사에게 질문하면 계산된 원국·강약·조후·격국·용신 후보·대운 요약이 상담 문맥으로 전달됩니다.

## 개인정보와 무료 등급 안내
- 운결은 출생일시 원문 대신 계산된 사주 기둥과 분석 요약을 상담 문맥으로 전송합니다.
- API 키는 Cloudflare Secret에만 보관합니다. 브라우저와 GitHub 저장소에는 노출하지 않습니다.
- 앱과 Worker 코드에는 대화 저장 기능이 없습니다. 다만 Google Gemini API 무료 등급은 제출한 콘텐츠가 Google 제품 및 모델 개선에 사용될 수 있습니다. 민감한 개인정보는 입력하지 말고, 자세한 사항은 [Gemini API 이용 약관 및 데이터 사용 안내](https://ai.google.dev/gemini-api/terms)를 확인하세요.
- CORS는 운결 사이트에서의 브라우저 호출을 제한하지만, Worker 주소를 아는 제3자의 직접 호출을 완전히 차단하지는 않습니다. 공개 운영 전 요청 제한과 남용 방지 설정을 검토하세요.
- 무료 등급의 요청 수·분당 토큰·일일 한도는 모델과 프로젝트에 따라 다르며 변경될 수 있습니다. 한도 초과 시 Worker가 안내 메시지를 표시합니다.

이 저장소의 코드 변경만으로 Worker가 자동 배포되지는 않습니다. Cloudflare 대시보드에서 Worker를 만들고 코드·변수·Secret을 등록해야 실제 AI 답변이 작동합니다.
