# /app/models/recommendation.py

from pydantic import BaseModel, Field

class SolvedProblemInformation(BaseModel):
    problem_id: str = Field(examples=["8"])
    time_spent: int = Field(examples=[3600], description="Time spent solving the problem in seconds")
    hint_count: int = Field(examples=[2], description="Number of hints used")
    
class RecommendRequest(BaseModel):
    last_solved_problem_id: str = Field(examples=["8"], description="ID of the last solved problem")
    solved_problems: list[SolvedProblemInformation] = Field(
        examples=[[
            {
                "problem_id": "8",
                "time_spent": 3600,
                "hint_count": 2
            },
            {
                "problem_id": "12",
                "time_spent": 1800,
                "hint_count": 0
            }
        ]],
        description="List of solved problems"
    )