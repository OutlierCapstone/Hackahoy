# reseed_vector_db.py
#
# 목적: 벡터DB를 "문제=1덩어리" 에서 "섹션 조각" 으로 다시 적재한다.
#
# 배경
#   - build_vector_db.py 는 문제 1개를 통짜 문서 1개(id="1"~"7")로 넣는다.
#     이 상태에서는 where={"problem_id": X} 필터를 걸면 후보가 1개뿐이라
#     검색이 아무것도 고르지 못하고(no-op), write-up(정답)이 매 힌트마다 컨텍스트에 들어간다.
#   - app/routers/wargames.py 의 add_wargame 이 이미 섹션 조각 적재를 구현해 두었으므로,
#     이 스크립트는 그 로직을 재사용해 기존 데이터를 다시 넣기만 한다.
#
# 사용법
#   ai-tutor 디렉터리에서:
#       python reseed_vector_db.py            # dry-run (무엇이 들어갈지만 출력)
#       python reseed_vector_db.py --apply    # 실제 삭제 + 재적재
#
# 주의
#   --apply 는 기존 통짜 문서를 지우고 다시 넣는다. 실행 전 CHROMA_PATH 백업 권장.

import argparse
import ast
import sys
from pathlib import Path

from app.clients import collection, logger
from app.models import WargameInformation
from app.routers.wargames import add_wargame

# 문제 데이터의 진실은 build_vector_db_recom.py 다.
# build_vector_db.py 는 Gen1(문제=통짜 문서) 시절 로더라 더 이상 관리하지 않는다.
# 이 스크립트는 파일을 실행하지 않고 wargames 리터럴만 AST 로 읽으므로,
# _recom 이 어느 컬렉션에 쓰도록 작성돼 있는지와는 무관하다.
# (적재는 clients.py 의 collection = wargame_collection 으로 간다)
SOURCE_FILE = Path(__file__).parent / "build_vector_db_recom.py"


def load_wargames() -> list[dict]:
    """build_vector_db.py 안의 wargames 리스트를 실행 없이 파싱해서 가져온다."""
    tree = ast.parse(SOURCE_FILE.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "wargames":
                    return ast.literal_eval(node.value)
    raise RuntimeError(f"{SOURCE_FILE} 안에서 wargames 리스트를 찾지 못했습니다.")


def to_model(game: dict) -> WargameInformation:
    """build_vector_db.py 의 dict 키(write-up)를 WargameInformation(writeup)에 맞춘다."""
    return WargameInformation(
        problem_id=str(game["problem_id"]),
        title=game["title"],
        category=game["category"],
        type=game["type"],
        difficulty=game["difficulty"],
        point=game["point"],
        writeup=game.get("write-up") or game.get("writeup", ""),
        observation=game["observation"],
        thinking=game["thinking"],
        wrong=game["wrong"],
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="실제로 삭제 후 재적재")
    args = parser.parse_args()

    wargames = load_wargames()
    print(f"대상 문제 {len(wargames)}개: {[g['problem_id'] for g in wargames]}")
    print(f"현재 컬렉션: {collection.name}, 문서 수: {collection.count()}")

    existing = collection.get()
    print(f"현재 id 샘플: {existing['ids'][:10]}")

    if not args.apply:
        print("\n[dry-run] --apply 를 붙이면 아래를 수행합니다:")
        for g in wargames:
            pid = g["problem_id"]
            print(f"  - problem_id={pid} 기존 문서 삭제 후 섹션 조각으로 재적재")
        print("\n예상 조각 id 형태: 1_type_def, 1_point, 1_write-up, 1_observation_0, 1_thinking_0 ...")
        return

    for game in wargames:
        pid = str(game["problem_id"])

        # 1) 기존 통짜 문서 제거 (id 가 problem_id 그대로인 형태)
        try:
            collection.delete(ids=[pid])
        except Exception as e:
            logger.warning(f"id={pid} 삭제 스킵: {e}")

        # 2) 같은 problem_id 의 잔여 조각도 제거 (재실행 안전성 확보)
        try:
            collection.delete(where={"problem_id": pid})
        except Exception as e:
            logger.warning(f"problem_id={pid} 잔여 삭제 스킵: {e}")

        # 3) 섹션 조각으로 재적재 (add_wargame 이 type_def 생성까지 담당)
        try:
            result = add_wargame(to_model(game))
            print(f"  [OK] problem_id={pid} -> {result['message']}")
        except Exception as e:
            print(f"  [FAIL] problem_id={pid}: {e}", file=sys.stderr)

    print(f"\n완료. 문서 수: {collection.count()}")
    after = collection.get()
    print(f"적재된 id 샘플: {sorted(after['ids'])[:15]}")

    # 검증: 섹션 필터가 실제로 동작하는지
    check = collection.get(where={"section": "type_def"})
    print(f"type_def 조각 수: {len(check['ids'])} (문제 수와 같아야 정상)")


if __name__ == "__main__":
    main()
