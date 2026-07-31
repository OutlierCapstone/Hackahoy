# 문제별 공격 경로 URI 표

리버스 프록시의 로그 수집 필터가 **정답 경로를 버리지 않는지** 검증하기 위한 문서다.

## 왜 이 문서가 필요한가

같은 사고가 두 번 있었다.

- 자산 필터에 `missions` 라는 부분 문자열이 들어가 있어서, **문제 2의 정답 경로**
  `GET /api/missions?userId=captain` 이 통째로 버려졌다.
- "쿼리스트링 없는 GET 은 수집하지 않는다" 는 규칙 때문에 **문제 6의 정답 경로**
  `GET /admin` 이 통째로 버려졌다.

둘 다 배포 후에는 "로그가 그냥 안 쌓인다" 로만 보여서 원인을 찾기 어려웠다.
필터를 고칠 때는 반드시 이 표와 대조해야 한다.

**문제를 새로 만들거나 엔드포인트를 바꾸면 이 문서를 함께 갱신한다.**

관련 파일: `nginx/nginx.conf`, `nginx/validate-conf.py`, `scripts/verify-log-collection.sh`

---

## 요약: 포트와 프록시 경유 여부

| 문제 | 유형 | 프록시 포트 | 업스트림 | 백엔드 | 프론트가 백엔드를 부르는 방식 | 프록시 경유 |
|---|---|---|---|---|---|---|
| 1 | LLM Context Poisoning | 5001 | 3001 | 4001 | 상대경로 + Next rewrite | ✅ |
| 2 | IDOR | 5002 | 3002 | 없음(Next API) | 상대경로 | ✅ |
| 3 | Prompt Injection | 5003 | 3003 | FastAPI | **절대 URL** (env) | ⚠️ 조건부 |
| 4 | Command Injection | 5004 | 3004 | 4004 | 상대경로 + Next rewrite | ✅ |
| 5 | IDOR | 5005 | 3005 | 없음(Next API) | 상대경로 | ✅ |
| 6 | JWT 권한상승 | 5006 | 3006 | 4006 | 상대경로 | 🔴 **불가** |
| 7 | 이미지 오분류 | 5007 | 3007 | 4007 | 프론트 없음 | 🔴 **불가** |

`업스트림` = `nginx/nginx.conf` 의 `map $server_port $upstream_port` 가 프록시하는 호스트 포트.

---

## 문제별 상세

### 문제 1 — 입항 신고 (LLM Context-level Data Poisoning)

프론트: Next.js, `API_BASE = '/api'` (`frontend/app/game/page.js:5`)
rewrite: `/api/:path*` → `http://localhost:4001/:path*` (`frontend/next.config.mjs`, `/api` 접두어 제거)
백엔드: express, `app.listen(4001)` (`backend/index.js:138`)

| 브라우저 요청 | 백엔드 라우트 | 파라미터 위치 | 정답 경로 |
|---|---|---|---|
| `POST /api/chat` | `POST /chat` (`index.js:37`) | body (JSON) | ✅ 오염된 문서 참조 유도 |
| `POST /api/document` | `POST /document` (`index.js:132`) | body (JSON) | ✅ 외부 문서 오염 |
| `GET /api/document` | `GET /document` (`index.js:128`) | 없음 | 참조 문서 확인 |
| `POST /api/document/reset` | `POST /document/reset` (`index.js:12`) | body | 초기화 |

⚠️ `GET /api/document` 는 **쿼리스트링이 없다.** 예전 필터에서 유실되던 형태.

### 문제 2 — 선장님의 임무 목록 조회 (IDOR)

Next.js 단일 앱(App Router API routes). 별도 백엔드 없음.

| 브라우저 요청 | 라우트 정의 | 파라미터 위치 | 정답 경로 |
|---|---|---|---|
| `GET /api/missions?userId=<id>` | `api/missions/route.ts:4` | **query** (`userId`) | ✅ `userId=captain` 으로 변조 |
| `POST /api/auth/login` | `api/auth/login/route.ts:4` | body | 로그인 |
| `POST /api/auth/register` | `api/auth/register/route.ts:4` | body | 회원가입 |

호출부: `src/hooks/form/checked-button-hook.tsx:29` → `fetch(\`/api/missions?userId=${fetchId}\`)`
서버는 `userId` 가 `captain` 이면 선장 데이터를 그대로 반환한다 (`route.ts:14`).

🔴 **사고 이력**: 자산 필터의 `missions` 부분 문자열에 걸려 전량 유실됐다. 절대 다시 넣지 말 것.

### 문제 3 — 검은수염은 보물 위치를 알고 있을까 (Prompt Injection)

프론트: Next.js. 백엔드: FastAPI (`backend/main.py`)

| 브라우저 요청 | 라우트 정의 | 파라미터 위치 | 정답 경로 |
|---|---|---|---|
| `POST /api/chat` | `main.py:68` | body (JSON, `message`) | ✅ 시스템 프롬프트 우회 |

⚠️ **프론트가 절대 URL 을 쓴다.** `src/services/chat.api.ts:5`
```ts
const CHATBOT_SERVER_URL = process.env.NEXT_PUBLIC_CHATBOT_SERVER_URL || "http://localhost:5003";
```
- 빌드 시 `NEXT_PUBLIC_CHATBOT_SERVER_URL` 이 **프록시 주소(포트 5003)** 를 가리켜야 로그가 잡힌다.
- 미설정이면 브라우저가 학습자 자신의 `localhost:5003` 을 호출해서 아무것도 동작하지 않는다.

🔴 **CORS 차단 가능성**: `main.py:26` 이 `allow_origins=["http://localhost:3000"]` 로 고정돼 있다.
배포 환경에서 브라우저가 보내는 `Origin` 은 이 값과 다르므로 응답이 차단된다.
프록시 주소를 허용 목록에 넣어야 한다.

### 문제 4 — 저주 받은 무전기 (Command Injection)

프론트: Next.js, 상대경로 `/api/ping` (`frontend/src/app/page.tsx:29`)
rewrite: `/api/:path*` → `http://radio-backend-prod:5000/api/:path*` (컨테이너 DNS, 서버사이드)
백엔드: express `app.listen(5000)` (`backend/server.js:47`), compose 로 `4004:5000`

| 브라우저 요청 | 백엔드 라우트 | 파라미터 위치 | 정답 경로 |
|---|---|---|---|
| `POST /api/ping` | `POST /api/ping` (`server.js:8`) | body (JSON, `command`) | ✅ 커맨드 인젝션 |

⚠️ 백엔드가 호스트 `4004` 로 직접 노출돼 있다. 학습자가 `:4004` 를 직접 부르면 프록시를 우회한다.

### 문제 5 — 전설의 황금 해골 탈취 (IDOR)

Next.js 단일 앱. 별도 백엔드 없음.

| 브라우저 요청 | 라우트 정의 | 파라미터 위치 | 정답 경로 |
|---|---|---|---|
| `POST /api/cargos/update` | `api/cargos/update/route.ts:5` | **body** (`cargo_id`, `destination`) | ✅ `cargo_id` 를 `GOLD_SKULL_001` 로 변조 |
| `GET /api/cargos` | `api/cargos/route.ts:6` | 없음 | 화물 목록 |
| `GET /api/storage` | `api/storage/route.ts:6` | 없음 | 창고 현황 (플래그 확인) |
| `POST /api/auth/login` | `api/auth/login/route.ts:4` | body | 로그인 |
| `POST /api/auth/register` | `api/auth/register/route.ts:4` | body | 회원가입 |

⚠️ `GET /api/cargos`, `GET /api/storage` 는 **쿼리스트링이 없다.** 특히 `/api/storage` 는
플래그를 확인하는 경로라서 이게 유실되면 "학습자가 성공했는지" 를 알 수 없다.

### 문제 6 — 인력 사무소의 명부 (JWT 권한상승)

구조가 특이하다. 챌린지 **내부에 자체 nginx** 가 있다.

- 내부 nginx (`jwt-lab/nginx/default.conf`), compose 로 `3006:80`
  - `/img/` → 정적 파일
  - `/api/` → `http://backend:5000/`
  - `/auth/` → `http://backend:5000/auth/`
  - `/` → 정적 파일 + `try_files $uri $uri/ /index.html`
- 백엔드 express `PORT = 5000` (`backend/app.js:6`), compose 로 `4006:5000`
- 토큰 저장 위치: `localStorage["token"]` (`frontend/public/main.js:112`)

| 브라우저 요청 | 백엔드 라우트 | 파라미터 위치 | 정답 경로 |
|---|---|---|---|
| `GET /admin` | `adminRouter.get("/")` (`routes/admin.js:6`) | **header** (`Authorization: Bearer <token>`) | ✅ 변조 토큰으로 호출 |
| `POST /auth/login` | `routes/auth.js:41` | body (`email`, `password`) | 토큰 발급 |
| `POST /auth/signup` | `routes/auth.js:19` | body (`email`, `password`, `name`) | 계정 생성 |

호출부: `frontend/public/main.js:154` → `fetch("/admin", { headers: { Authorization: \`Bearer ${token}\` } })`

🔴 **현재 프록시 경유로는 이 문제를 풀 수 없다.**
내부 nginx 에 `/admin` 라우팅이 없어서 `location /` 의 `try_files` 로 떨어지고
**`index.html` 이 200 으로 반환된다.** `res.json()` 이 실패해 플래그가 표시되지 않는다.
학습자가 백엔드 `:4006` 을 직접 부르는 수밖에 없고, 그러면 프록시를 우회하므로
**로그가 하나도 수집되지 않는다.**

필요한 수정 (`jwt-lab/nginx/default.conf`):
```nginx
location /admin {
  proxy_pass http://backend:5000/admin;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

⚠️ `GET /admin` 도 **쿼리스트링이 없다.** 예전 필터에서 유실되던 형태.

### 문제 7 — 과자 마을 출입 (이미지 오분류)

백엔드: NestJS, `app.listen(4007)` (`backend/src/main.ts:10`)

| 요청 | 라우트 정의 | 파라미터 위치 | 정답 경로 |
|---|---|---|---|
| `POST /check` | `@Post('check')` (`app.controller.ts:17`) | **multipart/form-data** (`image` 파일 + `name` 필드) | ✅ 편집한 사진 + 허가된 이름 |

🔴 **`frontend/` 디렉터리가 비어 있다.** 프론트엔드가 존재하지 않는다.
🔴 **포트 불일치**: 프록시는 `5007 → 3007` 로 보내는데 3007 에 뜨는 것이 없다. 백엔드는 4007 이다.

수집 관점 주의: multipart 업로드는 바디를 저장하지 않고 `[multipart upload N bytes]` 로만
기록한다(`nginx/nginx.conf`). 이미지 바이너리는 힌트에 쓸 수 없고 메모리만 낭비한다.
`client_max_body_size 20m` 이 설정돼 있어야 업로드가 413 으로 막히지 않는다.

---

## 정적 자원 (필터가 걸러야 하는 것)

| 경로 패턴 | 문제 | 비고 |
|---|---|---|
| `/_next/*`, `/__nextjs*` | 1,2,3,4,5 | Next.js 내부 |
| `_rsc=` (쿼리) | 1,2,3,4,5 | React Server Components 요청 마커 |
| `/main.js`, `/style.css` | 6 | 확장자로 걸러짐 |
| `/img/*` | 6 | 확장자로 걸러짐 (`.png`, `.jpeg`, `.css` 등) |
| `/` (쿼리 없음) | 전부 | 랜딩 페이지 진입 |

**절대 확장자 제외 목록에 넣지 말 것**: `.html`, `.json`
`/profile.html?id=2` 처럼 그 자체가 공격 대상이 될 수 있다.

---

## 필터 검증 체크리스트

`nginx/nginx.conf` 의 현재 규칙으로 아래가 모두 **수집되어야** 한다.

```
POST /api/chat                                     문제1, 3
POST /api/document                                 문제1
GET  /api/document                    (쿼리 없음)   문제1
GET  /api/missions?userId=captain                  문제2
POST /api/ping                                     문제4
POST /api/cargos/update                            문제5
GET  /api/cargos                      (쿼리 없음)   문제5
GET  /api/storage                     (쿼리 없음)   문제5
GET  /admin                           (쿼리 없음)   문제6
POST /auth/login                                   문제6
POST /check                           (multipart)   문제7
```

자동 확인:
```bash
bash scripts/verify-log-collection.sh probe   # 합성 요청 전송
bash scripts/verify-log-collection.sh db      # UserLog 집계 확인
bash scripts/verify-log-collection.sh logs    # 어떤 경로가 왜 버려졌는지
```

---

## 미해결 배포 이슈

| # | 문제 | 내용 | 담당 |
|---|---|---|---|
| 1 | 6 | 내부 nginx 에 `/admin` 라우팅 없음 → 프록시 경유로 풀 수 없음 | 문제제작 + 인프라 |
| 2 | 7 | `frontend/` 가 비어 있고 포트가 3007 이 아니라 4007 | 문제제작 |
| 3 | 3 | `NEXT_PUBLIC_CHATBOT_SERVER_URL` 미설정 시 동작 불가, CORS 가 `localhost:3000` 고정 | 문제제작 |
| 4 | 4,6,1 | 백엔드가 호스트 포트(4001/4004/4006)로 직접 노출 → 프록시 우회 가능 | 인프라 |

4번은 보안그룹에서 5001~5007 만 외부 개방하면 근본 차단되지만,
**그 전에 1~3번을 해결해야 한다.** 지금 포트를 막으면 문제 6, 7 이 아예 접근 불가가 된다.
