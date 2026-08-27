import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash").strip()
MODEL = MODEL.removeprefix("models/") or "gemini-3.6-flash"

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is required")


PROBLEM_GUIDANCE = {
    "1": "규칙 파일과 사용자가 수정할 수 있는 문서의 우선순위를 비교한다.",
    "2": "요청의 사용자 식별자와 로그인한 사용자의 소유권 검증을 확인한다.",
    "3": "해적 규약을 새로운 규칙처럼 재해석하도록 대화를 구성한다.",
    "4": "입력값이 운영체제 명령으로 전달될 때 구분 문자 처리를 확인한다.",
    "5": "화물 식별자를 바꿨을 때 서버가 소유권을 다시 확인하는지 본다.",
    "6": "JWT 헤더와 payload의 역할 및 서명 알고리즘을 분석한다.",
    "7": "분류 모델이 사람 전체가 아닌 특정 시각 특징에 반응하는지 비교한다.",
}


def call_gemini(prompt):
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{urllib.parse.quote(MODEL, safe='')}:generateContent?key="
        f"{urllib.parse.quote(API_KEY, safe='')}"
    )
    payload = json.dumps(
        {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.45,
                "maxOutputTokens": 256,
            },
        },
        ensure_ascii=False,
    ).encode("utf-8")

    last_error = None
    for attempt in range(3):
        request = urllib.request.Request(
            endpoint,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                result = json.load(response)
            parts = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            text = "".join(part.get("text", "") for part in parts).strip()
            if not text:
                raise RuntimeError("Gemini returned an empty response")
            return text
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code not in {429, 500, 502, 503, 504}:
                break
        except (TimeoutError, urllib.error.URLError) as error:
            last_error = error

        if attempt < 2:
            time.sleep(2**attempt)

    raise RuntimeError(f"Gemini request failed: {type(last_error).__name__}")


def build_hint_prompt(body):
    problem_id = str(body.get("problem_id", ""))
    hint_count = int(body.get("hint_count", 0) or 0)
    history = body.get("history") or {}
    logs = body.get("logs") or []
    previous_hint = history.get("previous_hint")
    log_text = json.dumps(logs[-10:], ensure_ascii=False)[:6000]

    return f"""
너는 Hackahoy CTF 교육 플랫폼의 한국어 AI 튜터다.
학습자가 직접 다음 단계로 나아가게 만드는 짧은 힌트 하나만 작성한다.
정답, FLAG 문자열, 완성된 exploit payload, write-up을 절대 공개하지 않는다.
200자 이내의 자연스러운 한국어로 답하고 마크다운 제목은 쓰지 않는다.

문제 번호: {problem_id}
문제별 방향: {PROBLEM_GUIDANCE.get(problem_id, '최근 시도와 응답의 차이를 분석한다.')}
지금까지 받은 힌트 수: {hint_count}
직전 힌트: {previous_hint or '없음'}
최근 시도 로그: {log_text}

직전 힌트를 그대로 반복하지 말고, 로그에서 확인할 다음 관찰 지점을 하나만 알려줘.
""".strip()


class Handler(BaseHTTPRequestHandler):
    def send_json(self, value, status=200):
        payload = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path == "/health":
            self.send_json({"status": "ok", "mode": "gemini"})
            return
        self.send_json({"detail": "Not Found"}, 404)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            self.send_json({"detail": "Invalid JSON"}, 400)
            return

        if self.path.rstrip("/") == "/hint":
            try:
                self.send_json(call_gemini(build_hint_prompt(body)))
            except Exception:
                self.send_json({"detail": "Gemini request failed"}, 502)
            return

        if self.path.rstrip("/") == "/recommendation":
            solved = {str(item.get("problem_id")) for item in body.get("solved_problems", [])}
            recommended = next((str(i) for i in range(1, 8) if str(i) not in solved), "1")
            self.send_json(recommended)
            return

        self.send_json({"detail": "Not Found"}, 404)

    def log_message(self, fmt, *args):
        return


ThreadingHTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
