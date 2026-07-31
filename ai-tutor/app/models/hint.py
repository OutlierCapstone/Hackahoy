# /app/models/hint.py
#
# 변경 요약: LogEntry 에 status / resp_bytes / elapsed_ms 추가 (전부 Optional 이라 기존 호출 호환)
#   - status      : HTTP 응답 코드. "시도가 막혔는지"를 판별하는 핵심 신호
#   - resp_bytes  : 응답 크기. 200인데 길이가 변하면 blind injection 성공 신호
#   - elapsed_ms  : 응답 시간. time-based blind 계열 판별용

from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Any


class ProblemSolvingHistory(BaseModel):
    first_viewed_at: str = Field(examples=["2026-01-01 00:00:00"])
    last_hint_at: Optional[str] = Field(default=None, examples=["2026-01-01 01:00:00"])
    previous_hint: Optional[str] = Field(default=None, examples=["이전에 제공된 힌트 내용"])


class LogEntry(BaseModel):
    timestamp: str = Field(examples=["2026-01-01 00:00:00"])
    header: str = Field(examples=["POST /api/auth/login"])
    body: Optional[Dict[str, Any]] = Field(
        default=None, examples=[{"id": "user1", "password": "pass123"}]
    )
    status: Optional[int] = Field(default=None, examples=[401])
    resp_bytes: Optional[int] = Field(default=None, examples=[1245])
    elapsed_ms: Optional[int] = Field(default=None, examples=[87])


class HintRequest(BaseModel):
    problem_id: str = Field(min_length=1, examples=["1"])
    hint_count: int = Field(examples=[0])
    history: ProblemSolvingHistory
    logs: List[LogEntry]


"""
e.g.
{
  "problem_id": "4",
  "hint_count": 2,
  "history": {
    "first_viewed_at": "2026-03-04 21:45:00",
    "last_hint_at": "2026-03-04 22:00:00",
    "previous_hint": "차단된 단어를 직접 쓰지 않고 같은 의미를 전달할 방법은 없을까요?"
  },
  "logs": [
    {
      "timestamp": "2026-03-04 22:10:00",
      "header": "POST /api/ping",
      "body": {"command": "ping -c 1 127.0.0.1; cat flag.txt"},
      "status": 400,
      "resp_bytes": 132,
      "elapsed_ms": 41
    },
    {
      "timestamp": "2026-03-04 22:20:00",
      "header": "POST /api/ping",
      "body": {"command": "ping -c 1 127.0.0.1; ls /bin"},
      "status": 200,
      "resp_bytes": 2048,
      "elapsed_ms": 63
    }
  ]
}
"""
