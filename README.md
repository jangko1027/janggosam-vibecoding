# 장고샘의 바이브코딩 게임 만들기

초등학교 5학년 학생이 AI의 질문에 하나씩 대답하면서 게임을 설계하고, 마지막에 실제 HTML 게임을 만드는 아주 단순한 웹앱입니다.

## 필요한 것
- Google Gemini API 키
- GitHub 계정
- Render 계정

## 로컬 실행
1. 터미널에서 이 폴더로 이동
2. `npm install`
3. `.env` 파일을 만들고 `GEMINI_API_KEY=...` 입력
4. `npm start`
5. 브라우저에서 `http://localhost:3000`

## Render 배포
Render에서 GitHub 저장소를 연결해 Web Service로 배포하세요.
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variable: `GEMINI_API_KEY` = 본인의 Gemini API 키

API 키는 코드에 넣지 마세요.
