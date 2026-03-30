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

// 유저 데이터
const users: User[] = [];

// 화물 초기 데이터
const cargos: Cargo[] = [
  { id: 'ROTTEN_BANANA', name: '썩은 바나나 묶음', quantity: 50, ownerRole: '신입', destination: '갑판', isFlag: false },
  { id: 'RUSTY_SWORD', name: '녹슨 검', quantity: 5, ownerRole: '신입', destination: '무기고', isFlag: false },
  { id: 'GOLD_SKULL', name: '전설의 황금 해골', quantity: 1, ownerRole: '선장', destination: '선장실', isFlag: true },
  { id: 'SILVER_COINS', name: '은화 자루', quantity: 100, ownerRole: '보급관', destination: '금고', isFlag: false },
];

export const db = {
  getUser: (id: string) => users.find((u) => u.id === id),

  createUser: (id: string, pwd: string) => {
    if (users.find((u) => u.id === id)) return false;
    users.push({ id, pwd, role: '신입' });
    return true;
  },

  getAllCargos: () => cargos,

  getMyCargos: (userId: string, userRole: string) => {
    return cargos.filter(c => c.destination === '창고');
  },

  updateCargoDestination: (cargoId: string, newDest: string) => {
    const cargo = cargos.find(c => c.id === cargoId);
    if (cargo) {
      cargo.destination = newDest;
      return true;
    }
    return false;
  }
};