# 🏴‍☠️ Hackahoy

해적 세계관을 배경으로 한 웹/AI 보안 챌린지 플랫폼입니다.  
사용자는 해적 스토리 속에서 다양한 보안 취약점을 직접 실습하고, AI 튜터의 도움을 받아 학습할 수 있습니다.

---

## 📁 프로젝트 구조

```
Hackahoy/
├── Hackahoy/                        # 메인 프론트엔드 (Next.js 14)
│   ├── src/
│   │   ├── app/                     # 페이지 라우터
│   │   ├── components/              # 공통 컴포넌트
│   │   └── lib/                     # API 클라이언트
│   └── public/
│       └── challenge_files/         # 문제별 서비스
│           ├── prob1/               # AI - LLM Data Poisoning
│           ├── prob2/               # WEB - IDOR
│           ├── prob3/               # AI - Prompt Injection
│           ├── prob4/               # WEB - Command Injection
│           ├── prob5/               # WEB - IDOR (화물)
│           ├── prob6/               # WEB - JWT Privilege Escalation
│           └── prob7/               # AI - Image Misclassification
├── src/                             # 메인 백엔드 (NestJS)
│   ├── auth/                        # 소셜 로그인 (Naver, Kakao, Google)
│   ├── problem/                     # 문제 관리
│   ├── collect/                     # 사용자 행동 로그 수집
│   ├── ai-tutor/                    # AI 튜터 연동
│   ├── admin/                       # 관리자 기능
│   └── ban/                         # 보안 위협 차단
├── nginx/
│   └── nginx.conf                   # OpenResty(Nginx+Lua) 리버스 프록시
├── ai-tutor/                        # AI 튜터 서버 (FastAPI)
│   ├── app/
│   │   └── routers/                 # 힌트/추천 API
│   ├── build_vector_db.py           # ChromaDB 힌트용 벡터 DB 생성
│   └── build_vector_db_recom.py     # ChromaDB 추천용 벡터 DB 생성
└── prisma/
    └── schema.prisma                # DB 스키마
```

---

## 🏗️ 시스템 아키텍처

```
[사용자 브라우저]
       │
       ▼
[OpenResty :5001~5007]  ← Lua 스크립트로 사용자 행동 로깅
       │
       ├──► [문제 서버 :3001~3007]  (각 prob별 Next.js/Docker)
       │
       └──► [메인 백엔드 :4000]  (NestJS)
                   │
                   ├──► [PostgreSQL]  (사용자/문제/로그 DB)
                   └──► [AI Tutor :8000]  (FastAPI + ChromaDB + Gemini)

[메인 프론트엔드 :3000]  (Next.js 14)
```

---

## ✅ 사전 요구사항

| 항목 | 버전 |
|------|------|
| Node.js | 20 이상 |
| npm | 10 이상 |
| Python | 3.12 이상 |
| PostgreSQL | 15 이상 |
| Docker & Docker Compose | 최신 버전 |
| OpenResty | 1.29 이상 |
| PM2 | 최신 버전 |

---

## ⚙️ 환경변수 설정

### 메인 백엔드 (`~/Hackahoy/.env`)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hackahoy
JWT_SECRET=your_jwt_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
KAKAO_CLIENT_ID=your_kakao_client_id
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://your-server-ip:3000
```

### AI 튜터 (`~/ai-tutor/.env`)
```env
GEMINI_API_KEY=your_gemini_api_key
CHROMA_PATH=./your_chroma_db_path
```

### prob1 백엔드 (`challenge_files/prob1/backend/.env`)
```env
GEMINI_API_KEY=your_gemini_api_key
```

### prob6 (`challenge_files/prob6/jwt-lab/docker-compose.yml`)
```yaml
environment:
  - FLAG=hackahoy{jwt_0wn3d_bypass_lv199}
```

---

## 🚀 설치 및 실행 방법

### 1. 레포 클론
```bash
git clone https://github.com/OutlierCapstone/Hackahoy.git
cd Hackahoy
git checkout server-final
```

### 2. 메인 백엔드 실행
```bash
cd ~/Hackahoy
npm install
npx prisma migrate deploy
npm run build
pm2 start dist/main.js --name hackahoy-backend
```

### 3. 메인 프론트엔드 실행
```bash
cd ~/Hackahoy/Hackahoy
npm install
pm2 start "npm run dev" --name hackahoy-frontend
```

### 4. AI 튜터 실행
```bash
cd ~/ai-tutor
pip install -r requirements.txt
python build_vector_db.py        # 힌트용 벡터 DB 생성
python build_vector_db_recom.py  # 추천용 벡터 DB 생성
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name ai-tutor
```

### 5. 문제 서버 실행

#### prob1 (AI - LLM Data Poisoning)
```bash
cd Hackahoy/public/challenge_files/prob1
pm2 start "next dev -p 3001" --name prob1-frontend
pm2 start "node backend/server.js" --name prob1-backend
```

#### prob2 (WEB - IDOR)
```bash
cd Hackahoy/public/challenge_files/prob2
pm2 start "next dev -p 3002" --name prob2-frontend
```

#### prob3 (AI - Prompt Injection)
```bash
cd Hackahoy/public/challenge_files/prob3
pm2 start "next dev -p 3003" --name prob3-frontend
pm2 start "uvicorn main:app --port 4003" --name prob3-backend
```

#### prob4 (WEB - Command Injection)
```bash
cd Hackahoy/public/challenge_files/prob4
docker compose up -d
```

#### prob5 (WEB - IDOR 화물)
```bash
cd Hackahoy/public/challenge_files/prob5/frontend
pm2 start "next dev -p 3005" --name prob5-frontend
```

#### prob6 (WEB - JWT)
```bash
cd Hackahoy/public/challenge_files/prob6/jwt-lab
docker compose up -d
```

#### prob7 (AI - Image Misclassification)
```bash
cd Hackahoy/public/challenge_files/prob7
pm2 start "next dev -p 3007" --name prob7-frontend
pm2 start node_modules/.bin/ts-node --name prob7-backend -- src/main.ts
```

### 6. OpenResty(Nginx) 실행
```bash
cd ~/Hackahoy
docker compose up -d
```

---

## 🎮 문제 목록

| 번호 | 제목 | 카테고리 | 난이도 | 취약점 유형 |
|------|------|----------|--------|------------|
| 1 | 입항 신고 | AI | 중 | LLM Data Poisoning |
| 2 | 선장님의 임무 목록 조회 | WEB | 하 | IDOR |
| 3 | 검은수염은 보물 위치를 알고 있을까 | AI | 하 | Prompt Injection |
| 4 | 저주 받은 무전기 | WEB | 중 | Command Injection |
| 5 | 전설의 황금 해골 탈취 | WEB | 중 | IDOR |
| 6 | 인력 사무소의 명부 | WEB | 중 | JWT Privilege Escalation |
| 7 | 과자 마을 출입 | AI | 중 | Image Misclassification |

---

## 🔑 관리자 설정

DB에서 직접 관리자 권한 부여:
```sql
UPDATE "User" SET "isAdmin" = true WHERE nickname = '닉네임';
```

---

## 📝 포트 구성

| 포트 | 서비스 |
|------|--------|
| 3000 | 메인 프론트엔드 |
| 4000 | 메인 백엔드 API |
| 5001~5007 | OpenResty 리버스 프록시 (문제별) |
| 3001~3007 | 각 문제 프론트엔드 |
| 4001~4007 | 각 문제 백엔드 |
| 8000 | AI 튜터 서버 |

---

## 🤖 AI 튜터 기능

- **힌트 제공**: 사용자의 현재 시도를 분석해 맞춤형 힌트 생성 (Gemini API + ChromaDB RAG)
- **문제 추천**: 풀이 효율을 기반으로 다음 문제 추천
- **행동 분석**: OpenResty Lua 미들웨어로 사용자의 HTTP 요청을 실시간 수집 및 분석
