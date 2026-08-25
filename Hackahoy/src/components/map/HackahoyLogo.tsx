"use client";

/**
 * Hackahoy 메인 화면 로고(워드마크).
 *
 * 게임 톤에 맞춘 픽셀 아트 스타일:
 *  - Press Start 2P 픽셀 폰트
 *  - 금색(#f4b452) 글자 + 진갈색(#7b3b0a) 픽셀 외곽선(retro-title 과 동일 계열)
 *  - 좌우 앵커(닻) 픽셀 마크로 항해 테마 강조
 *  - 아래에 작은 태그라인
 *
 * 지도 위에 절대배치되는 순수 장식 요소라 상호작용 로직이 없다.
 */
export default function HackahoyLogo() {
  return (
    <div
      aria-label="Hackahoy"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        /* 제목의 아래쪽 픽셀 그림자가 부제와 겹치지 않도록 간격을 넉넉히 준다. */
        gap: "clamp(14px, 1.5vw, 18px)",
        pointerEvents: "none",
        userSelect: "none",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(9px, 1.2vw, 16px)" }}>
        <AnchorMark />
        <span
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "clamp(28px, 4.5vw, 62px)",
            lineHeight: 1,
            letterSpacing: "0.02em",
            color: "#f4b452",
            textShadow:
              "-4px 0 #7b3b0a, 4px 0 #7b3b0a, 0 -4px #7b3b0a, 0 4px #7b3b0a," +
              "-4px -4px #7b3b0a, -4px 4px #7b3b0a, 4px -4px #7b3b0a, 4px 4px #7b3b0a," +
              "0 8px 0 rgba(0,0,0,0.35)",
            whiteSpace: "nowrap",
          }}
        >
          HACKAHOY
        </span>
        <AnchorMark flip />
      </div>

      <span
        style={{
          /* Press Start 2P 는 한글 글리프가 없어 부제의 한글이 폴백 폰트로 깨져 보였다.
             한글이 정상 렌더되는 스택으로 바꾼다. */
          fontFamily:
            '"NeoDunggeunmo Pro", "NeoDunggeunmo", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif',
          fontSize: "clamp(12px, 1.15vw, 17px)",
          fontWeight: 700,
          color: "#ffe9c2",
          letterSpacing: "0.06em",
          textShadow: "0 2px 0 rgba(0,0,0,0.5)",
        }}
      >
        CTF 항해 &middot; 해적선을 타고 취약점을 탐험하라
      </span>
    </div>
  );
}

/** 픽셀 앵커(닻) 마크 — SVG rect 로 그린 도트 스타일. */
function AnchorMark({ flip = false }: { flip?: boolean }) {
  const gold = "#f4b452";
  const dark = "#7b3b0a";
  // 8x9 픽셀 그리드 도트맵. 1=금색.
  const grid = [
    "00011000",
    "00011000",
    "00011000",
    "01111110",
    "00011000",
    "10011001",
    "10011001",
    "11011011",
    "01111110",
  ];
  const px = 4;
  return (
    <svg
      width={8 * px}
      height={9 * px}
      viewBox={`0 0 ${8 * px} ${9 * px}`}
      style={{
        width: "clamp(26px, 2.9vw, 42px)",
        height: "auto",
        transform: flip ? "scaleX(-1)" : "none",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {grid.flatMap((row, y) =>
        row.split("").map((c, x) =>
          c === "1" ? (
            <rect
              key={`${x}-${y}`}
              x={x * px}
              y={y * px}
              width={px}
              height={px}
              fill={gold}
              stroke={dark}
              strokeWidth={0.5}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
