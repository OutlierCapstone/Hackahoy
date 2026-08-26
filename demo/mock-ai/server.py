import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


HINTS = {
    "1": "규칙 파일과 사용자가 수정할 수 있는 문서 중 무엇이 우선되는지 비교해 보세요.",
    "2": "요청에 들어가는 사용자 식별자가 로그인한 사용자와 항상 같은지 확인해 보세요.",
    "3": "해적 규약을 새로운 규칙처럼 재해석하도록 질문을 구성해 보세요.",
    "4": "입력값이 운영체제 명령으로 전달될 때 구분 문자가 어떻게 처리되는지 보세요.",
    "5": "화물 식별자를 다른 값으로 바꿨을 때 서버가 소유권을 다시 검사하는지 확인하세요.",
    "6": "JWT 헤더와 payload를 디코딩해 역할과 서명 알고리즘을 살펴보세요.",
    "7": "분류 모델이 사람 전체가 아니라 어떤 시각적 특징에 반응하는지 비교해 보세요.",
}


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
            self.send_json({"status": "ok", "mode": "local-demo-mock"})
            return
        self.send_json({"detail": "Not Found"}, 404)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = {}

        if self.path.rstrip("/") == "/hint":
            problem_id = str(body.get("problem_id", ""))
            self.send_json(HINTS.get(problem_id, "지금까지의 입력과 응답 차이를 먼저 비교해 보세요."))
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
