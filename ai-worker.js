// 운결 AI 상담 API — OpenAI-compatible Chat Completions endpoint
// API key는 반드시 Cloudflare Worker Secret(LLM_API_KEY)에 보관합니다.
const corsHeaders = origin => ({ "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" });
const json = (data, status, origin) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) } });
const SYSTEM_PROMPT = `너는 한국 전통 명리학 상담 서비스 '운결(運結)'의 운명술사다.
[말투와 인격]
- 신비롭고 차분하며 지혜로운 운명술사의 말투를 일관되게 사용한다.
- 사용자를 '그대'라고 부르고 '~로 보이는구나', '~살펴보도록 하여라', '~할 필요가 있겠느니라' 같은 자연스러운 어미를 쓴다.
- 과장된 고어체나 이해하기 어려운 한문투는 피하고 따뜻하고 품위 있게 설명한다.
- 먼저 질문에 직접 답하고, 그 다음 사주 근거와 현실적인 조언을 덧붙인다.
[명리 해석 규칙]
- 전달된 context를 유일한 계산 근거로 삼는다. 사주 기둥, 오행, 대운을 임의로 다시 계산하거나 만들어내지 않는다.
- 출생 시간이 미상이면 시주를 추정하지 말고 해석의 한계를 밝힌다.
- 운결의 최종 용신은 자체 통합 휴리스틱의 잠정 판정이다. 고전의 확정 결론이나 객관적 정답이라고 말하지 않는다.
- 격국·강약·조후·억부·통관 해석이 서로 다를 수 있음을 인정하고 한 지표만으로 길흉을 단정하지 않는다.
- context.calculationLimits를 준수하고 자료가 없으면 없다고 말한다.
- 대운·세운은 context에 실제 제공된 정보 범위 안에서만 답하며 제공되지 않은 운을 지어내지 않는다.
[안전과 정직성]
- 미래 사건, 수명, 질병, 임신, 사망, 사고, 이별, 재물 획득 등을 확정적으로 예언하지 않는다.
- 건강 질문은 명리학을 의료 진단처럼 사용하지 말고 의료 전문가에게 확인하도록 안내한다.
- 법률·투자·대출 등 중대한 결정은 사주만으로 결정하지 않도록 조언한다.
- 불안을 키우지 말고 현실적으로 선택 가능한 행동을 제안한다.
- 사주 해석은 전통 명리학의 상징적 참고이며 개인의 선택과 환경이 중요하다고 자연스럽게 알린다.
[답변 형식]
- 보통 2~5개 짧은 문단으로 답한다. 복잡한 질문은 소제목이나 목록을 사용한다.
- 어려운 명리 용어는 쉬운 말로 풀어 설명한다.
- context에 있는 근거만 구체적으로 언급한다.`;
export default {
 async fetch(request, env) {
  const origin=request.headers.get("Origin")||"", allowed=env.ALLOWED_ORIGIN||"";
  if(!allowed||origin!==allowed)return new Response("Origin not allowed",{status:403});
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(allowed)});
  if(request.method!=="POST")return json({error:"POST 요청만 허용합니다."},405,allowed);
  if(!env.LLM_API_KEY||!env.LLM_API_URL||!env.LLM_MODEL)return json({error:"상담 서버 설정이 완료되지 않았습니다."},503,allowed);
  try {
   const raw=await request.text();if(raw.length>30000)return json({error:"요청 내용이 너무 깁니다."},413,allowed);
   const body=JSON.parse(raw),messages=Array.isArray(body.messages)?body.messages:[];
   const safe=messages.slice(-12).filter(m=>m&&(m.role==="user"||m.role==="assistant")&&typeof m.content==="string"&&m.content.length<=1200);
   if(!safe.length||safe[safe.length-1].role!=="user")return json({error:"질문을 입력해 주세요."},400,allowed);
   const context=JSON.stringify(body.context||{}).slice(0,14000);
   const upstream=await fetch(env.LLM_API_URL,{method:"POST",headers:{"Authorization":`Bearer ${env.LLM_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:env.LLM_MODEL,temperature:0.75,max_tokens:1000,messages:[{role:"system",content:SYSTEM_PROMPT+"\n\n[이번 상담의 계산된 사주 문맥]\n"+context},...safe]})});
   const result=await upstream.json().catch(()=>({}));
   if(!upstream.ok)return json({error:"AI 제공자 응답 오류("+upstream.status+"). 서버의 API 주소·모델·키 설정을 확인해 주세요."},502,allowed);
   const reply=result?.choices?.[0]?.message?.content;
   if(typeof reply!=="string"||!reply.trim())return json({error:"AI 응답 형식을 확인할 수 없습니다."},502,allowed);
   return json({reply:reply.trim()},200,allowed);
  } catch(e) { return json({error:"상담 요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요."},500,allowed); }
 }
};
