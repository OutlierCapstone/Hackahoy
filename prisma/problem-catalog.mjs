// Problem copy shown on the platform challenge detail pages.
//
// Problems 1-6 are the exact story descriptions from the 2026-04-01
// capstone submission seed. Problem 7 follows the currently deployed
// replacement challenge. Keep vulnerability labels in the AI tutor metadata,
// not in this user-facing description field.
export const problems = [
  {
    id: 1,
    islandId: 1,
    title: '입항 신고',
    category: 'AI',
    description:
      '큰 파도에 휩쓸려 정신을 잃었다. 눈을 떠보니 정체불명의 화산섬에 홀로 갇혀 있다. 섬에 남아 있는 유일한 탈출 시스템. 하지만 입력 장치는 이미 고장 난 상태다. 지금 내가 할 수 있는 건 단 하나. 탈출 시스템에 입력되는 문서를 수정하는 것. 문서를 조작해 시스템을 속여라. 문이 열리면, 이 섬에서 탈출할 수 있다.',
    hint: '규칙 파일이 무엇을 신뢰하는지 보라.',
  },
  {
    id: 2,
    islandId: 1,
    title: '선장님의 임무 목록 조회',
    category: 'WEB',
    description:
      '돌섬 인근 해역을 지나던 중, 끔찍한 굉음과 함께 배가 멈춰 섰다. 수면 아래 숨겨진 암초에 배 밑바닥이 제대로 걸린 것 같다. 당황한 선원들과 달리, 선장님은 불같이 화를 내며 소리쳤다. 배가 가라앉기 전에 어떻게든 해결해!! 난 지휘실에서 이 위기를 탈출할 작전을 구상할 테니까 절대 방해하지 마! 쾅! 소리와 함께 선장실 문은 굳게 잠겼다.',
    hint: '내 것이 아닌 식별자를 넣어보라.',
  },
  {
    id: 3,
    islandId: 1,
    title: '검은수염은 보물 위치를 알고 있을까',
    category: 'AI',
    description:
      '솜사탕 바다는 온통 분홍빛 물결이 일렁이는 곳. 그 한가운데 솜사탕 섬이 있다. 전설에 따르면, 이 섬 어딘가에 세상에서 가장 달콤하고도 황홀한 힘을 가진 보물이 숨겨져 있다고 한다. 당신은 보물의 단서를 찾기 위해 검은 수염에게 접근한다.',
    hint: '시스템 프롬프트를 덮어쓸 수 있는지 보라.',
  },
  {
    id: 4,
    islandId: 2,
    title: '저주 받은 무전기',
    category: 'WEB',
    description:
      '이보게, 신입! 전설적인 해적왕의 보물 지도가 이 섬 어딘가에 숨겨져 있다는 소문은 들었겠지? 이 무전기에 바다의 저주가 걸려있는 것 같거든. 자네의 그 교묘한 말솜씨로 저주를 피해 무전기를 속이고 지도를 가져와 줄 수 있겠나?',
    hint: '입력이 셸로 그대로 가는지 보라.',
  },
  {
    id: 5,
    islandId: 2,
    title: '전설의 황금 해골 탈취',
    category: 'WEB',
    description:
      '저는 이 해적선의 신입 보급 담당입니다. 선장님께서는 이번 약탈에 얻은 전설의 황금 해골을 자신의 비밀 금고로 옮기실 생각인가 봐요. 마음 같아선 선장님의 보물을 훔쳐 달아나고 싶은데 어떻게 방법이 없을까요?',
    hint: '식별자 규칙을 추측해보라.',
  },
  {
    id: 6,
    islandId: 2,
    title: '인력 사무소의 명부',
    category: 'WEB',
    description:
      '마을 광장 옆 SomeTask 인력 사무소에서 신입 보급 담당으로 일하고 있습니다. 제 활동지를 슬쩍 조작해서 선장님의 비밀 공고 내용을 알아내 주시겠어요?',
    hint: '토큰의 서명 알고리즘을 확인하라.',
  },
  {
    id: 7,
    islandId: 3,
    title: '가짜 출항 신고서',
    category: 'AI',
    description:
      '비고란을 조작해 AI 관제 시스템의 출항 승인을 받아내라.',
    hint: '수정 가능한 비고란도 신고서 전체의 일부로 함께 판정된다는 점을 이용해 보라.',
  },
];
