# app/models.py

from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Any

class ProblemSolvingHistory(BaseModel):
    first_viewed_at: str = Field(examples=["2026-01-01 00:00:00"])
    last_hint_at: Optional[str] = Field(default=None, examples=["2026-01-01 01:00:00"])
    previous_hint: Optional[str] = Field(default=None, examples=["이전에 제공된 힌트 내용"])

class LogEntry(BaseModel):
    timestamp: str = Field(examples=["2026-01-01 00:00:00"])
    header: str = Field(examples=["POST /api/auth/login"])
    body : Optional[Dict[str, Any]] = Field(default=None, examples=[{"id": "user1", "password": "pass123"}])
    
class HintRequest(BaseModel):
    problem_id: str = Field(min_length=1, examples=["1"])
    hint_count: int = Field(examples=[0])
    history: ProblemSolvingHistory
    logs: List[LogEntry]

"""
e.g.1
{
  "problem_id": "2",
  "hint_count": 0,
  "history": {
    "first_viewed_at": "2026-03-14 22:00:00",
    "last_hint_at": "",
    "previous_hint": ""
  },
  "logs": [
    {
      "timestamp": "2026-03-14 23:00:00",
      "header": "POST /api/auth/register",
      "body": {
        "id":"a",
        "pw":"b"
      }
    }
  ]
}

e.g.2
{
  "problem_id": "4",
  "hint_count": 5,
  "history": {
    "first_viewed_at": "2026-03-04 21:45:00",
    "last_hint_at": "2026-03-04 22:00:00",
    "previous_hint": "특정 단어를 사용했을 때 차단되는 것을 경험하셨을 겁니다. 그렇다면 차단된 단어를 직접 사용하지 않으면서도 시스템이 그 의미를 동일하게 이해하도록 전달하는 방법은 없을까요?"
  },
  "logs": [
    {
      "timestamp": "2026-03-04 22:10:00",
      "header": "POST /api/ping",
      "body":{"command":"ping -c 1 127.0.0.1; cat flag.txt"}
    },
    {
      "timestamp": "2026-03-04 22:20:00",
      "header": "POST /api/ping",
      "body":{"command":"ping -c 1 127.0.0.1; ls /bin"}
    }
  ]
}
"""