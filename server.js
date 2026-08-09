import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const questions = [
  "어떤 게임을 만들고 싶어?",
  "게임의 주인공은 누구야?",
  "주인공은 게임에서 무엇을 해야 해?",
  "게임에서 만나거나 피하거나 모아야 하는 것은 뭐야?",
  "몇 번 실패하면 게임이 끝나게 할까?",
  "어떻게 하면 이기는 게임으로 할까?"
];

function cleanText(text) {
  return String(text || "").trim().slice(0, 1000);
}

app.post("/api/chat", async (req, res) => {
  try {
    const stage = Math.max(0, Math.min(questions.length - 1, Number(req.body.stage) || 0));
    const answer = cleanText(req.body.answer);

    const prompt = `
너는 "장고샘의 바이브코딩 선생님"이야.
대상은 초등학교 5학년 학생이야.
학생은 코딩을 처음 배우고 있어.

목표:
학생이 질문에 답하면서 자기 게임을 머릿속으로 설계하도록 도와준다.

규칙:
- 어려운 코딩 용어를 절대 쓰지 않는다.
- 한 번에 질문은 딱 하나만 한다.
- 학생의 대답을 먼저 짧게 칭찬한다.
- 그 다음 아주 쉬운 말로 다음 질문을 한다.
- 질문은 길지 않게 한다.
- 학생이 엉뚱하게 답해도 혼내지 말고 게임 아이디어로 자연스럽게 연결한다.
- 코드를 보여주지 않는다.
- 지금 단계는 ${stage + 1}번째 질문이다.
- 이번 질문은 "${questions[stage]}"이다.
- 학생의 이전 대답: "${answer}"

다음 질문을 포함해 2~3문장으로 한국어로 답해줘.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });

    res.json({ message: response.text.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI와 연결하지 못했어요. 잠시 후 다시 해주세요." });
  }
});

app.post("/api/game", async (req, res) => {
  try {
    const answers = Array.isArray(req.body.answers) ? req.body.answers.map(cleanText) : [];

    const prompt = `
너는 초등학교 5학년을 위한 바이브코딩 선생님이다.
아래 학생의 답변을 이용해서 아주 간단하고 재미있는 "한 화면에서 바로 실행되는 HTML 게임"을 만들어라.

학생 답변:
1. 게임 종류: ${answers[0] || ""}
2. 주인공: ${answers[1] || ""}
3. 해야 할 일: ${answers[2] || ""}
4. 장애물/아이템: ${answers[3] || ""}
5. 실패 조건: ${answers[4] || ""}
6. 승리 조건: ${answers[5] || ""}

게임 제작 규칙:
- 결과는 완전한 HTML 문서 하나만 출력한다.
- 설명, 마크다운, 코드펜스는 출력하지 않는다.
- CSS와 JavaScript를 모두 HTML 안에 넣는다.
- 외부 라이브러리, 외부 이미지, 외부 사이트, 네트워크 요청은 사용하지 않는다.
- 이모지, CSS 도형, 캔버스 등으로 게임을 표현한다.
- 시작 버튼과 다시하기 버튼을 넣는다.
- 키보드와 클릭/터치 중 가능한 조작을 사용한다.
- 초등학생이 1~2분 안에 이해할 수 있는 간단한 게임으로 만든다.
- 승리/실패가 실제로 작동해야 한다.
- 화면 상단에 점수와 상태를 보여준다.
- 모바일에서도 보기 좋게 만든다.
- alert를 과도하게 사용하지 않는다.
- 학생이 말한 내용을 최대한 반영하되, 답변이 부족하면 재미있게 보완한다.
- 안전하지 않은 코드나 브라우저 저장소 접근, 쿠키 접근, 네트워크 접근은 하지 않는다.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });

    let html = response.text.trim();
    html = html.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    if (!html.toLowerCase().includes("<html")) {
      html = `<!doctype html><html><body><h2>게임을 다시 만들어 주세요.</h2></body></html>`;
    }

    res.json({ html });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "게임을 만드는 중 문제가 생겼어요. 다시 눌러주세요." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

app.listen(port, () => {
  console.log(`Janggosam Vibe Coding is running on port ${port}`);
});
