import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

const questions = [
  "[화면과 시작] 게임 화면은 어떻 방식으로 움직이게 할까?",
  "[주인공과 조작] 주인공은 누구고, 키보드/마우스로 어떻게 움직여?",
  "[목표와 점수] 어떤 아이템(또는 몬스터)이 나오고, 먹거나 맞추면 몇 점이 올라가?",
  "[위험과 장애물] 피해야 하는 적이나 장애물은 무엇이고, 어떻게 움직여?",
  "[승리와 패배] 목품은 몇 개로 시작하고, 어떻게 해야 '게임 오버'나 '승리'가 돼?",
  "[특별 기능] 게임을 더 재미있게 만들기 위해 '특별한 효과' 1가지만 넣는다면 뭐야?"
];

function cleanText(text) {
  return String(text || "").trim().slice(0, 1000);
}


// -----------------------------
// 1. 학생과 대화하는 부분
// -----------------------------

app.post("/api/chat", async (req, res) => {
  try {
    const stage = Math.max(
      0,
      Math.min(
        questions.length - 1,
        Number(req.body.stage) || 0
      )
    );

    const answer = cleanText(req.body.answer);

    const prompt = `
너는 "장고샘의 바이브코딩 선생님"이야.

대상은 초등학교 5학년 학생이야.
학생은 코딩을 처음 배우고 있어.

목표:
학생이 AI의 질문에 하나씩 대답하면서
자기만의 게임을 머릿속으로 쉽게 설계하도록 도와준다.

규칙:

- 어려운 코딩 용어를 절대 사용하지 않는다.
- 한 번에 질문은 딱 하나만 한다.
- 학생의 대답을 먼저 짧게 칭찬한다.
- 그 다음 아주 쉬운 말로 다음 질문을 한다.
- 질문은 짧고 재미있게 한다.
- 학생이 엉뚱하게 답해도 혼내지 않는다.
- 학생의 아이디어를 최대한 게임으로 연결한다.
- 코드를 보여주지 않는다.
- 초등학교 5학년이 이해할 수 있는 말만 사용한다.

현재 단계:
${stage + 1}번째 질문

이번 질문:
${questions[stage]}

학생의 대답:
${answer}

다음 질문을 포함해서 2~3문장으로 한국어로 답해줘.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });

    res.json({
      message: response.text.trim()
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);

    res.status(500).json({
      error: "AI와 연결하지 못했어요. 잠시 후 다시 해주세요."
    });
  }
});


// -----------------------------
// 2. 학생의 답으로 게임을 만드는 부분
// -----------------------------

app.post("/api/game", async (req, res) => {
  try {
    const answers = Array.isArray(req.body.answers)
      ? req.body.answers.map(cleanText)
      : [];

    const prompt = `
너는 초등학교 5학년을 위한 바이브코딩 선생님이다.

아래 학생의 답변을 이용해서
아주 간단하고 재미있는
"한 화면에서 바로 실행되는 HTML 게임"을 만들어라.

학생 답변:

1. 게임 종류:
${answers[0] || ""}

2. 주인공:
${answers[1] || ""}

3. 해야 할 일:
${answers[2] || ""}

4. 장애물 또는 아이템:
${answers[3] || ""}

5. 실패 조건:
${answers[4] || ""}

6. 승리 조건:
${answers[5] || ""}


게임 제작 규칙:

- 완전한 HTML 문서 하나만 출력한다.
- 설명을 출력하지 않는다.
- 마크다운을 출력하지 않는다.
- 코드펜스를 사용하지 않는다.
- CSS와 JavaScript를 HTML 안에 모두 넣는다.
- 외부 라이브러리를 사용하지 않는다.
- 외부 이미지를 사용하지 않는다.
- 외부 사이트에 연결하지 않는다.
- 인터넷 연결을 필요로 하지 않는다.
- 이모지, CSS 도형, HTML 요소, Canvas 등을 이용해 게임을 만든다.
- 시작 방법을 화면에 쉽게 설명한다.
- 다시 시작할 수 있는 버튼을 만든다.
- 키보드 또는 클릭/터치로 조작할 수 있게 한다.
- 초등학생이 1~2분 안에 이해할 수 있는 간단한 게임으로 만든다.
- 승리와 실패가 실제로 작동해야 한다.
- 점수나 목숨을 화면에 표시한다.
- 모바일에서도 보기 좋게 만든다.
- 학생의 아이디어를 최대한 게임에 반영한다.
- 답변이 부족하면 재미있게 보완한다.
- 위험한 내용은 만들지 않는다.
- 브라우저의 쿠키나 개인정보를 사용하지 않는다.
- 네트워크 요청을 하지 않는다.

반드시 실행 가능한 게임을 만들어라.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });

    let html = response.text.trim();

    // Gemini가 혹시 코드펜스를 붙여도 제거
    html = html
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // HTML이 제대로 만들어졌는지 확인
    if (!html.toLowerCase().includes("<html")) {
      html = `
<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>게임 만들기</title>
</head>
<body>
<h2>게임을 다시 만들어 주세요.</h2>
</body>
</html>
`;
    }

    res.json({
      html: html
    });

  } catch (error) {
    console.error("GAME ERROR:", error);

    res.status(500).json({
      error: "게임을 만드는 중 문제가 생겼어요. 다시 눌러주세요."
    });
  }
});


// -----------------------------
// 3. 웹페이지 보여주기
// -----------------------------

app.use((req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});


// -----------------------------
// 4. 서버 시작
// -----------------------------

app.listen(port, () => {
  console.log(
    `Janggosam Vibe Coding is running on port ${port}`
  );
});
