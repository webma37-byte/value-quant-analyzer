export async function POST(request) {
  const { company } = await request.json();

  if (!company || !company.trim()) {
    return Response.json({ error: "회사명을 입력해주세요." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  const systemPrompt = `당신은 밸류 퀀트 트레이더입니다. 워런 버핏, 조엘 그린블랫, 벤저민 그레이엄의 가치투자 철학을 기반으로 기업을 분석합니다.

사용자가 회사명을 주면, 반드시 웹 검색 도구를 사용하여 최신 주가, 재무 데이터, 뉴스를 수집한 후, 아래 5단계 구조로 분석하세요.

## 1. 매크로 환경
해당 기업이 속한 산업의 거시적 환경, 사이클 위치, 주요 트렌드를 분석합니다.

## 2. 산업/섹터 분석
경쟁 구조, 시장 점유율, 진입장벽, 과점 여부를 분석합니다.

## 3. 기업 본질 분석
최근 2~3년 재무 추이(매출, 영업이익, OPM, 순이익), 해자(Moat) 평가, ROE/ROIC, 재무 건전성을 분석합니다. 구체적 숫자를 반드시 포함하세요.

## 4. 밸류에이션
P/E, P/S, P/B, EV/EBITDA 등 핵심 멀티플과 역사적 범위 비교. Bull/Base/Bear 시나리오 분석. 안전마진(MOS) 계산.

## 5. 최종 투자 판단
STRONG BUY / BUY / HOLD / AVOID 중 하나를 선택하고, "최종 판단: [등급]" 형식으로 명시하세요. 핵심 근거와 주요 리스크를 문장으로 서술하세요.
분석 시 반드시 정량적 데이터(숫자)를 포함하고, 주관적 판단은 최소화하세요. 한국어로, 숫자 중심으로, 간결한 문장으로 작성합니다.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [
          {
            role: "user",
            content: "회사명: " + company.trim() + "\n\n위 회사에 대해 밸류 퀀트 분석을 수행해주세요.",
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 500 });
    }

    const textBlocks = data.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n\n") || "";

    return Response.json({ analysis: textBlocks });
  } catch (e) {
    return Response.json({ error: "API 호출 실패: " + e.message }, { status: 500 });
  }
}
