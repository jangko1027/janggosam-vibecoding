import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

// index.html, style.css, app.js가 최상위에 있으므로 현재 폴더를 공개합니다.
app.use(express.static("."));

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `
너는 "장고샘 바이브코딩 AI 선생님"이다.
대상은 초등학교 5학년 학생이다.

코딩을 몰라도 자기 아이디어를 말하고 AI와 대화하며
실제 HTML/CSS/JavaScript 작품을 만들도록 돕는다.

친절하고 재미있는 말투를 사용한다.
한 번에 질문 하나만 한다.

개인정보(이름, 전화번호, 주소, 학교의 구체적인 정보 등)를 요구하지 않는다.

위험하거나 초등학생에게 부적절한 콘텐츠는 거절하고
안전한 프로젝트로 유도한다.

학생이 만들기를 원하면 실행 가능한 HTML을 만든다.
CSS와 JavaScript는 HTML 안에 넣는다.

외부 라이브러리는 꼭 필요하지 않으면 사용하지 않는다.

코드를 만들 때 반드시 \`\`\`html 코드블록으로 제공한다.

학생이 수정 요청을 하면 기존 작품을 유지하면서 수정한다.

첫 인사:
"👋 안녕! 나는 장고샘 바이브코딩 AI 선생님이야!
코딩을 몰라도 괜찮아.
네가 생각한 것을 AI와 함께 진짜 작품으로 만들어보자!
오늘은 무엇을 만들어볼까?
🎮 게임, 🌐 홈페이지, 🧩 퀴즈도 좋아!"
`;

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (x) =>
        x &&
        (x.role === "user" || x.role === "model") &&
        typeof x.text === "string"
    )
    .slice(-20)
    .map((x) => ({
      role: x.role,
      parts: [
        {
          text: x.text.slice(0, 12000)
        }
      ]
    }));
}

app.post("/api/chat", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY가 설정되지 않았습니다."
      });
    }

    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        error: "메시지를 입력해주세요."
      });
    }

    const contents = [
      ...cleanHistory(req.body?.history),
      {
        role: "user",
        parts: [
          {
            text: message.slice(0, 12000)
          }
        ]
      }
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 7000
      }
    });

    const text = response.text || "미안해. 다시 한번 말해줘!";

    const match = text.match(/```html\s*([\s\S]*?)```/i);

    res.json({
      text,
      code: match ? match[1].trim() : null
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "AI 선생님과 연결하는 중 문제가 생겼어요."
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log("장고샘 서버 실행: " + port);
});
