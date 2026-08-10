const $ = (s) => document.querySelector(s);

const chat = $("#messages");
const input = $("#input");
const form = $("#form");
const iframe = $("#iframe");
const codeBox = $("#code");
const run = $("#run");
const copy = $("#copy");
const empty = $("#empty");
const project = $("#project");

let stage = Number(localStorage.getItem("gameStage") || "0");
let answers = JSON.parse(localStorage.getItem("gameAnswers") || "[]");
let current = localStorage.getItem("jc") || "";


// -----------------------------
// 메시지 보여주기
// -----------------------------

function add(role, text) {
  const d = document.createElement("div");
  d.className = "msg " + role;

  const b = document.createElement("div");
  b.className = "bubble";

  b.textContent = text;

  d.appendChild(b);
  chat.appendChild(d);

  chat.scrollTop = chat.scrollHeight;
}


// -----------------------------
// 게임 코드 보여주기
// -----------------------------

function setCode(c) {
  current = c;

  localStorage.setItem("jc", c);

  codeBox.textContent = c;

  run.disabled = false;
  copy.disabled = false;

  empty.style.display = "none";

  iframe.srcdoc = c;
}


// -----------------------------
// AI에게 질문하기
// -----------------------------

async function askAI(answer = "") {
  const thinking = document.createElement("div");

  thinking.className = "msg ai";
  thinking.innerHTML = '<div class="bubble">👩‍🏫 장고샘이 생각하고 있어요…</div>';

  chat.appendChild(thinking);
  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        stage: stage,
        answer: answer
      })
    });

    const data = await response.json();

    thinking.remove();

    if (!response.ok) {
      throw new Error(data.error || "AI 연결 오류");
    }

    add("ai", data.message);

  } catch (error) {
    thinking.remove();

    add(
      "ai",
      "앗! 선생님과 연결하는 데 문제가 생겼어요. 잠시 후 다시 해보자 😊"
    );

    console.error(error);
  }
}


// -----------------------------
// 게임 만들기
// -----------------------------

async function makeGame() {
  const thinking = document.createElement("div");

  thinking.className = "msg ai";
  thinking.innerHTML =
    '<div class="bubble">🎮 네 생각을 가지고 게임을 만들고 있어요!<br>조금만 기다려 주세요 😊</div>';

  chat.appendChild(thinking);
  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch("/api/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answers: answers
      })
    });

    const data = await response.json();

    thinking.remove();

    if (!response.ok) {
      throw new Error(data.error || "게임 만들기 오류");
    }

    if (!data.html) {
      throw new Error("게임 코드가 만들어지지 않았어요.");
    }

    setCode(data.html);

    add(
      "ai",
      "🎉 게임이 완성됐어요!\n\n오른쪽 화면에서 바로 게임을 해보세요!\n\n마음에 안 드는 부분이 있다면 「＋ 새 작품」을 눌러 새로운 게임도 만들 수 있어요."
    );

    project.textContent =
      answers[0] ? answers[0].slice(0, 24) : "나의 게임";

    localStorage.setItem(
      "jp",
      project.textContent
    );

    localStorage.setItem(
      "gameFinished",
      "true"
    );

  } catch (error) {
    thinking.remove();

    add(
      "ai",
      "앗! 게임을 만드는 중 문제가 생겼어요 😢\n\n다시 한 번 눌러서 만들어 보자!"
    );

    console.error(error);
  }
}


// -----------------------------
// 학생의 대답 처리
// -----------------------------

async function send(text) {
  text = text.trim();

  if (!text) return;

  // 이미 6개 답변을 모두 끝냈다면
  if (stage >= 6) {
    add(
      "ai",
      "🎮 이미 게임이 완성됐어요!\n「＋ 새 작품」을 누르면 새로운 게임을 만들 수 있어요."
    );

    input.value = "";
    return;
  }

  // 학생 대답 화면에 표시
  add("user", text);

  input.value = "";


  // 학생의 답 저장
  answers.push(text);

  localStorage.setItem(
    "gameAnswers",
    JSON.stringify(answers)
  );


  // 다음 단계로 이동
  stage++;

  localStorage.setItem(
    "gameStage",
    String(stage)
  );


  // -----------------------------
  // 6번째 대답까지 끝났다면
  // 바로 게임 만들기
  // -----------------------------

  if (stage === 6) {

    add(
      "ai",
      "👏 정말 잘했어요!\n\n이제 네가 생각한 내용을 가지고 진짜 게임을 만들어볼게요! 🎮"
    );

    await makeGame();

    return;
  }


  // -----------------------------
  // 아직 질문이 남아 있다면
  // 다음 질문 요청
  // -----------------------------

  await askAI(text);
}


// -----------------------------
// 입력창
// -----------------------------

form.onsubmit = (e) => {
  e.preventDefault();

  send(input.value);
};


// -----------------------------
// 빠른 선택 버튼
// -----------------------------

document
  .querySelectorAll(".quick button")
  .forEach((button) => {

    button.onclick = () => {
      send(button.textContent);
    };

  });


// -----------------------------
// 추천 미션
// -----------------------------

document
  .querySelectorAll(".mission")
  .forEach((button) => {

    button.onclick = () => {
      send(button.textContent);
    };

  });


// -----------------------------
// 실행 버튼
// -----------------------------

run.onclick = () => {

  if (!current) return;

  iframe.srcdoc = current;

};


// -----------------------------
// 코드 복사
// -----------------------------

copy.onclick = async () => {

  if (!current) return;

  try {

    await navigator.clipboard.writeText(current);

    copy.textContent = "복사 완료 ✓";

    setTimeout(() => {

      copy.textContent = "코드 복사";

    }, 1200);

  } catch (error) {

    console.error(error);

  }

};


// -----------------------------
// 새 작품
// -----------------------------

$("#new").onclick = () => {

  const ok = confirm(
    "새로운 게임을 만들어볼까요?"
  );

  if (!ok) return;

  localStorage.removeItem("gameStage");
  localStorage.removeItem("gameAnswers");
  localStorage.removeItem("gameFinished");
  localStorage.removeItem("jh");
  localStorage.removeItem("jc");
  localStorage.removeItem("jp");

  location.reload();

};


// -----------------------------
// 기존 게임 복원
// -----------------------------

project.textContent =
  localStorage.getItem("jp") ||
  "새로운 작품";


if (current) {

  setCode(current);

}


// -----------------------------
// 처음 시작할 때 첫 질문
// -----------------------------

if (stage === 0 && answers.length === 0) {

  add(
    "ai",
    "👋 안녕! 나는 장고샘 바이브코딩 AI 선생님이야!\n\n코딩을 몰라도 괜찮아. 내가 하나씩 물어볼게.\n\n네가 대답만 하면 마지막에는 진짜 게임이 만들어져! 🎮"
  );

  askAI("");

}
