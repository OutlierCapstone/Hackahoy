# update_wrong_chunks.py
#
# 목적: wrong 섹션 조각만 build_vector_db_recom.py 기준으로 맞춘다.
#
# 왜 reseed 를 쓰지 않는가
#   reseed_vector_db.py 는 문제별로 add_wargame 을 호출하고, add_wargame 은
#   매번 generate_type_definition() 으로 gemini-2.5-flash 를 1회 부른다.
#   문제 7개면 flash 7회다. 무료 티어 분당 5회를 ai-tutor·prob1·prob3 가
#   공유하고 있어서 429 가 나기 쉽다.
#
#   게다가 type_def 는 LLM 생성물이라 돌릴 때마다 문장이 달라진다.
#   wrong 만 고치려고 전체를 재적재하면 안 건드려도 될 type_def 가 매번 흔들린다.
#
#   이 스크립트는 wrong 조각만 다루므로 flash 호출이 0 이고,
#   임베딩(gemini-embedding-001)만 조각 수만큼 발생한다.
#
# 사용법 (ai-tutor 디렉터리에서)
#   venv/bin/python update_wrong_chunks.py            # dry-run
#   venv/bin/python update_wrong_chunks.py --apply    # 실제 반영
#
# 안전장치
#   - 조각 id 는 add_wargame 과 같은 규칙({problem_id}_wrong_{index})을 쓴다.
#   - 기존 wrong 조각 중 새 목록에 없는 id 는 지운다(줄어든 경우 잔재 방지).
#   - 다른 섹션(type_def/point/write-up/observation/thinking)은 건드리지 않는다.

import argparse
import ast
import re
import sys
from pathlib import Path

from app.clients import collection, logger

SOURCE_FILE = Path(__file__).parent / "build_vector_db_recom.py"


def load_wargames() -> list[dict]:
    """build_vector_db_recom.py 의 wargames 리터럴을 실행 없이 읽는다."""
    tree = ast.parse(SOURCE_FILE.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "wargames":
                    return ast.literal_eval(node.value)
    raise RuntimeError(f"{SOURCE_FILE} 에서 wargames 를 찾지 못했습니다.")


def split_lines(text: str) -> list[str]:
    """add_wargame 과 같은 규칙. 빈 줄은 버리고 각 줄이 조각 1개가 된다."""
    return [line.strip() for line in text.split("\n") if line.strip()]


# wrong 섹션에 들어가면 안 되는 어미.
#
# SECTION_MAP 을 보면 wrong 은 레벨 1~4 전부에 들어간다. write-up 은 레벨 3 아래로
# 물리적으로 차단되지만 wrong 은 그렇지 않아서, 여기에 "~하는 것이 핵심이다" 같은
# 해법 방향이 들어가면 첫 힌트부터 정답이 새어 나간다.
# wrong 은 오답을 배제하고 학습자가 무엇을 확인하지 않았는지를 짚는 데까지만 쓴다.
LEAK_PATTERN = re.compile(
    r"(핵심이다|중요하다|효과적이다|집중해야 한다|고려해야 한다|시도해볼 수 있다|필요가 있다)\.?$"
)


def lint(wargames: list[dict]) -> list[str]:
    """반영 전 형식 점검. 문제가 있으면 사유 목록을 돌려준다."""
    problems: list[str] = []
    for game in wargames:
        pid = game["problem_id"]
        for line in split_lines(game["wrong"]):
            if not line.startswith("-"):
                # "주장 + 설명" 을 두 줄로 적으면 설명만 맥락 없이 떨어져 나온다.
                problems.append(f"문제 {pid}: 불릿(-)으로 시작하지 않는 줄 — {line[:60]}")
            if LEAK_PATTERN.search(line):
                problems.append(f"문제 {pid}: 해법 방향 제시로 끝남 — {line[:60]}")
    return problems


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="실제로 반영")
    parser.add_argument(
        "--skip-lint", action="store_true", help="형식 점검을 건너뛴다(권장하지 않음)"
    )
    args = parser.parse_args()

    wargames = load_wargames()

    issues = lint(wargames)
    if issues:
        print("형식 점검에서 걸린 항목:")
        for msg in issues:
            print(f"  - {msg}")
        if not args.skip_lint:
            raise SystemExit("\n반영을 중단했습니다. 문장을 고치거나 --skip-lint 를 쓰세요.")
        print("  (--skip-lint 로 무시하고 진행합니다)\n")
    print(f"컬렉션: {collection.name} (총 {collection.count()}개)")

    existing = collection.get(where={"section": "wrong"})
    existing_ids = set(existing["ids"])
    print(f"현재 wrong 조각: {len(existing_ids)}개")

    planned: dict[str, tuple[str, dict]] = {}
    for game in wargames:
        pid = str(game["problem_id"])
        for idx, line in enumerate(split_lines(game["wrong"])):
            planned[f"{pid}_wrong_{idx}"] = (
                line,
                {
                    "problem_id": pid,
                    "title": game["title"],
                    "category": game["category"].lower(),
                    "type": game["type"],
                    "difficulty": game["difficulty"],
                    "section": "wrong",
                },
            )

    stale = sorted(existing_ids - set(planned))
    print(f"새 wrong 조각: {len(planned)}개, 삭제 대상(잔재): {len(stale)}개")

    if not args.apply:
        print("\n[dry-run] --apply 를 붙이면 아래를 수행합니다.")
        for cid in sorted(planned):
            print(f"  upsert {cid}: {planned[cid][0][:60]}")
        for cid in stale:
            print(f"  delete {cid}")
        print("\nflash 호출 0회, 임베딩 호출 {}회 예상".format(len(planned)))
        return

    if stale:
        collection.delete(ids=stale)
        print(f"잔재 {len(stale)}개 삭제 완료")

    ok = 0
    for cid, (doc, meta) in sorted(planned.items()):
        try:
            collection.upsert(ids=[cid], documents=[doc], metadatas=[meta])
            ok += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  [FAIL] {cid}: {exc}", file=sys.stderr)
            logger.error(f"wrong 조각 {cid} upsert 실패: {exc}")

    print(f"upsert 완료 {ok}/{len(planned)}")

    after = collection.get(where={"section": "wrong"})
    print(f"반영 후 wrong 조각: {len(after['ids'])}개, 총 문서: {collection.count()}개")


if __name__ == "__main__":
    main()
