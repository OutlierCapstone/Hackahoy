# /app/models/wargame.py

from pydantic import BaseModel, Field

class WargameInformation(BaseModel):
    problem_id: str = Field(examples=["8"])
    title: str = Field(examples=["전설의 황금 해골 탈취"])
    category: str = Field(examples=["web/AI"])
    type: str = Field(examples=["Insecure Direct Object Reference (IDOR)"])
    point: str = Field(examples=["서버가 사용자의 역할은 확인하지만, 요청 데이터 내의 특정 객체(화물 ID)에 대한 소유권 및 제어 권한은 검증하지 않음을 이용"], description="The essence of the problem here...")
    writeup: str = Field(examples=["1. 회원가입 (회원가입 시 자동으로 '신입' 권한 부여 받음) 2. ... "], description="Detailed write-up here...")
    observation: str = Field(examples=["화면에는 모든 화물의 목록이 노출된다."], description="Key observations here...")
    thinking: str = Field(examples=["내가 옮기려는 화물 번호 대신, 다른 화물 번호를 넣고 서버로 보낸다면 어떻게 될까?"], description="Questions that guide the user's thinking process here...")
    wrong: str = Field(examples=["선장의 계정을 탈취하기 위해 로그인 페이지에서 무차별 대입 공격(Brute Force)을 시도하거나 세션을 하이재킹할 필요는 없다."], description="Common mistakes here...")
    difficulty: str = Field(examples=["상/중/하"], description="Difficulty level here...")
    
"""
e.g.
{
  "problem_id": "8",
  "title": "전설의 황금 해골 탈취 2",
  "category": "web",
  "type": "Insecure Direct Object Reference (IDOR)",
  "point": "서버가 사용자의 역할은 확인하지만, 요청 데이터 내의 특정 객체(화물 ID)에 대한 소유권 및 제어 권한은 검증하지 않음을 이용",
  "writeup": "1. 회원가입 (회원가입 시 자동으로 '신입' 권한 부여 받음) 2. ... ",
  "observation": "화면에는 모든 화물의 목록이 노출된다.",
  "thinking": "내가 옮기려는 화물 번호 대신, 다른 화물 번호를 넣고 서버로 보낸다면 어떻게 될까?",
  "wrong": "선장의 계정을 탈취하기 위해 로그인 페이지에서 무차별 대입 공격(Brute Force)을 시도하거나 세션을 하이재킹할 필요는 없다.",
  "difficulty": "상"
}
"""