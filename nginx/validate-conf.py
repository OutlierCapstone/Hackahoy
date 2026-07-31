#!/usr/bin/env python3
"""nginx.conf 안의 Lua 블록 구조와 로그 수집 회귀를 검증한다.

배경
  nginx.conf 의 자산 필터에 "missions" 라는 부분 문자열이 들어가 있어서
  문제 2(IDOR)의 정답 경로 /api/missions?userId=... 가 통째로 버려지고 있었다.
  같은 이유로 "쿼리 없는 GET 전량 폐기" 규칙이 문제 6의 GET /admin 을 죽였다.
  이런 종류의 회귀는 배포 후에 로그가 "그냥 안 쌓인다"로만 보여서 찾기 어렵다.

사용법
  python3 nginx/validate-conf.py            # nginx/nginx.conf 검사
  python3 nginx/validate-conf.py <path>

  OpenResty 가 있으면 문법 검증은 그쪽이 정확하다:
  docker run --rm -v "$PWD/nginx/nginx.conf":/usr/local/openresty/nginx/conf/nginx.conf:ro \
      openresty/openresty:alpine openresty -t
"""
import re
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "nginx/nginx.conf"

try:
    text = open(SRC, encoding="utf-8").read()
except OSError as e:
    print(f"[ERROR] {e}")
    sys.exit(2)

errors: list[str] = []
warnings: list[str] = []

BLOCK_RE = re.compile(r"(\w+_by_lua_block)\s*\{")


def find_blocks(s: str):
    """balanced-brace 로 lua 블록 본문을 잘라낸다 (문자열/주석 인식)."""
    out = []
    for m in BLOCK_RE.finditer(s):
        name = m.group(1)
        line_no = s.count("\n", 0, m.start()) + 1
        start = m.end()
        depth, i = 1, start
        in_str, in_comment = None, False
        while i < len(s):
            ch = s[i]
            nxt = s[i + 1] if i + 1 < len(s) else ""
            if in_comment:
                if ch == "\n":
                    in_comment = False
            elif in_str:
                if ch == "\\":
                    i += 2
                    continue
                if ch == in_str:
                    in_str = None
            elif ch == "-" and nxt == "-":
                in_comment = True
                i += 1
            elif ch in "\"'":
                in_str = ch
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    out.append((name, line_no, s[start:i]))
                    break
            i += 1
        else:
            errors.append(f"{name} (line {line_no}): 닫는 중괄호를 찾지 못했다")
    return out


def strip_lua(code: str):
    """문자열과 주석을 공백으로 치환. 미종료 문자열을 보고한다."""
    out, problems = [], []
    i, n = 0, len(code)
    while i < n:
        ch = code[i]
        nxt = code[i + 1] if i + 1 < n else ""
        if ch == "-" and nxt == "-":
            j = code.find("\n", i)
            j = n if j == -1 else j
            out.append(" " * (j - i))
            i = j
        elif ch in "\"'":
            quote, j, closed = ch, i + 1, False
            while j < n:
                if code[j] == "\\":
                    j += 2
                    continue
                if code[j] == "\n":
                    break
                if code[j] == quote:
                    closed = True
                    break
                j += 1
            if not closed:
                problems.append(
                    f"문자열이 같은 줄에서 닫히지 않았다 (블록 내 line {code.count(chr(10), 0, i) + 1})"
                )
                j = min(j, n - 1)
            out.append(" " * (j - i + 1))
            i = j + 1
        else:
            out.append(ch)
            i += 1
    return "".join(out), problems


blocks = find_blocks(text)
print(f"Lua 블록 {len(blocks)}개 발견\n")

for name, line, code in blocks:
    label = f"{name} (line {line})"
    clean, probs = strip_lua(code)
    errors.extend(f"{label}: {p}" for p in probs)

    for op, cl, what in [("(", ")", "소괄호"), ("{", "}", "중괄호"), ("[", "]", "대괄호")]:
        a, b = clean.count(op), clean.count(cl)
        if a != b:
            errors.append(f"{label}: {what} 불균형 {op}={a} {cl}={b}")

    def cnt(word: str) -> int:
        return len(re.findall(r"\b" + word + r"\b", clean))

    openers = cnt("function") + cnt("if") + cnt("do")
    closers = cnt("end")
    if openers != closers:
        errors.append(
            f"{label}: end 개수 불일치 (function={cnt('function')} "
            f"if={cnt('if')} do={cnt('do')} 합계={openers} vs end={closers})"
        )
    if cnt("repeat") != cnt("until"):
        errors.append(f"{label}: repeat/until 불일치")
    if cnt("if") != cnt("then"):
        warnings.append(f"{label}: if={cnt('if')} then={cnt('then')}")

    print(f"  [구조 OK] {label}: {len(code.splitlines())}줄, "
          f"function={cnt('function')} if={cnt('if')} end={closers}")

# nginx 지시어 중괄호 균형 (주석 줄 제외)
conf = "\n".join(l for l in text.splitlines() if not l.strip().startswith("#"))
if conf.count("{") != conf.count("}"):
    errors.append(
        f"nginx.conf 전체 중괄호 불균형: {{={conf.count('{')} }}={conf.count('}')}"
    )

# ------------------------------------------------------------------ 회귀 방지
if re.search(r'find\("missions"', text):
    errors.append(
        "`missions` 부분 문자열 필터가 남아 있다 "
        "-> 문제 2 의 정답 경로 /api/missions?userId= 가 수집되지 않는다"
    )

if re.search(r'find\("webpack"', text):
    errors.append(
        "`webpack` 부분 문자열 필터가 남아 있다 "
        "-> 쿼리스트링에 우연히 포함되면 공격 요청이 버려진다. ^/_next/ 접두어로 고정할 것"
    )

if re.search(r'method\s*==\s*"GET"', text) and "root_nav" not in text:
    errors.append(
        "쿼리 없는 GET 전량 폐기 규칙이 남아 있다 "
        "-> 문제 6 의 GET /admin, 경로 기반 IDOR 이 수집되지 않는다"
    )

if re.search(r"local\s+ext\s*=\s*(uri|ngx\.var\.request_uri)", text):
    errors.append(
        "자산 확장자 검사가 쿼리 포함 URI 를 대상으로 한다 "
        "-> ?file=a.png 같은 페이로드가 자산으로 오탐된다. ngx.var.uri(path) 를 쓸 것"
    )

for html_like in ("html = true", "json = true"):
    if html_like in text:
        errors.append(
            f"자산 확장자 목록에 {html_like} 가 있다 "
            "-> /profile.html?id=2 같은 공격 대상이 버려진다"
        )

REQUIRED = [
    ("error_log", "진단 로그를 stderr 로 내보내는 설정"),
    ("skip_collect =", "수집을 건너뛴 이유 기록"),
    ('"success"%s*:%s*false', "백엔드 거부(HTTP 200 + success:false) 감지"),
    ("prob_id 매핑 없음", "prob_id=0 경고 (FK 위반으로 유실됨)"),
    ("uid 없음", "anonymous 폐기 경고"),
    ("전송 실패", "collect API 전송 실패 로그"),
]
for needed, why in REQUIRED:
    if needed not in text:
        errors.append(f"누락: `{needed}` — {why}")

# listen 포트와 map 키가 일치하는지
listen_ports = set(re.findall(r"listen\s+(\d+)\s*;", text))
prob_map = re.search(r"map\s+\$server_port\s+\$prob_id\s*\{(.*?)\}", text, re.S)
up_map = re.search(r"map\s+\$server_port\s+\$upstream_port\s*\{(.*?)\}", text, re.S)
for m, label in [(prob_map, "prob_id"), (up_map, "upstream_port")]:
    if not m:
        errors.append(f"map $server_port ${label} 블록을 찾지 못했다")
        continue
    keys = set(re.findall(r"^\s*(\d+)\s+\S+;", m.group(1), re.M))
    missing = listen_ports - keys
    extra = keys - listen_ports
    if missing:
        errors.append(f"{label} map 에 없는 listen 포트: {sorted(missing)}")
    if extra:
        warnings.append(f"{label} map 에만 있고 listen 되지 않는 포트: {sorted(extra)}")

print()
for w in warnings:
    print(f"  [warn]  {w}")
if errors:
    print("\n=== 검증 실패 ===")
    for e in errors:
        print(f"  [ERROR] {e}")
    sys.exit(1)
print("=== 검증 통과 ===")
