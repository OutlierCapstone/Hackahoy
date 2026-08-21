export interface User {
  id: string;
  pwd: string;
  role: string;
}

export interface Cargo {
  id: string;
  name: string;
  quantity: number;
  ownerRole: string;
  destination: string;
  isFlag: boolean;
}

interface PlayerState {
  users: User[];
  cargos: Cargo[];
}

const MAX_PLAYER_STATES = 5000;

const createInitialCargos = (): Cargo[] => [
  { id: 'ROTTEN_BANANA', name: '썩은 바나나 묶음', quantity: 50, ownerRole: '신입', destination: '갑판', isFlag: false },
  { id: 'RUSTY_SWORD', name: '녹슨 검', quantity: 5, ownerRole: '신입', destination: '무기고', isFlag: false },
  { id: 'GOLD_SKULL', name: '전설의 황금 해골', quantity: 1, ownerRole: '선장', destination: '선장실', isFlag: true },
  { id: 'SILVER_COINS', name: '은화 자루', quantity: 100, ownerRole: '보급관', destination: '금고', isFlag: false },
];

declare global {
  var prob5PlayerStates: Map<string, PlayerState> | undefined;
}

// Next.js가 API route를 별도 번들로 로드해도 같은 프로세스에서는 하나의 맵을
// 사용한다. 플레이어 키마다 초기 화물과 challenge 내부 계정을 따로 보관한다.
const playerStates = globalThis.prob5PlayerStates ??= new Map<string, PlayerState>();

function getPlayerState(playerKey: string): PlayerState {
  const existing = playerStates.get(playerKey);
  if (existing) return existing;

  const state = { users: [], cargos: createInitialCargos() };
  playerStates.set(playerKey, state);

  if (playerStates.size > MAX_PLAYER_STATES) {
    const oldestKey = playerStates.keys().next().value;
    if (oldestKey !== undefined) playerStates.delete(oldestKey);
  }

  return state;
}

export const db = {
  getUser: (playerKey: string, id: string) =>
    getPlayerState(playerKey).users.find((user) => user.id === id),

  createUser: (playerKey: string, id: string, pwd: string) => {
    const users = getPlayerState(playerKey).users;
    if (users.find((user) => user.id === id)) return false;
    users.push({ id, pwd, role: '신입' });
    return true;
  },

  getAllCargos: (playerKey: string) =>
    getPlayerState(playerKey).cargos.map((cargo) => ({ ...cargo })),

  getMyCargos: (playerKey: string) =>
    getPlayerState(playerKey).cargos
      .filter((cargo) => cargo.destination === '창고')
      .map((cargo) => ({ ...cargo })),

  updateCargoDestination: (playerKey: string, cargoId: string, newDest: string) => {
    const cargo = getPlayerState(playerKey).cargos.find((item) => item.id === cargoId);
    if (cargo) {
      cargo.destination = newDest;
      return true;
    }
    return false;
  }
};
