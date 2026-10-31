import { FuelType, EntryType } from './types';

export const FUEL_TYPES: Record<string, [string, string]> = {
  e10: ['E10 RON95', 'E10'],
  e5: ['E5 RON92', 'E5'],
  ron95: ['RON95 khoáng', 'RON95'],
  other: ['Loại khác', 'Khác'],
};

export const ENTRY_TYPES: Record<EntryType, { label: string; varColor: string; icon: string }> = {
  fuel: { label: 'Đổ xăng', varColor: '--fuel', icon: '⛽' },
  service: { label: 'Bảo dưỡng', varColor: '--svc', icon: '🔧' },
  other: { label: 'Chi phí khác', varColor: '--oth', icon: '🧾' },
  income: { label: 'Thu nhập', varColor: '--in', icon: '💰' },
};

export const COMMON_BRANDS = [
  'Honda',
  'Yamaha',
  'Suzuki',
  'SYM',
  'Piaggio',
  'Vespa',
  'VinFast',
  'Toyota',
  'Hyundai',
  'Kia',
  'Mazda',
  'Ford',
  'Mitsubishi',
  'Mercedes-Benz',
  'BMW',
  'Honda ô tô',
];

export const COMMON_PART_NAMES = [
  'Nhớt máy',
  'Bugi',
  'Lọc gió động cơ',
  'Lọc gió điều hòa',
  'Lọc nhớt',
  'Lọc xăng',
  'Má phanh',
  'Dầu phanh',
  'Dây curoa',
  'Nước làm mát',
  'Lốp trước',
  'Lốp sau',
  'Ắc quy',
];

export const SV = (b: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">${b}</svg>`;

export const PRESET_BACKGROUNDS = [
  {
    id: 'sunset',
    name: '🌅 Hoàng hôn',
    svg: SV(
      '<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2a6e"/><stop offset=".55" stop-color="#e2557b"/><stop offset="1" stop-color="#ffb86b"/></linearGradient></defs><rect width="800" height="500" fill="url(#a)"/><circle cx="400" cy="270" r="70" fill="#ffd9a0" opacity=".9"/><polygon points="0,500 0,330 800,330 800,500" fill="#2a1c3d"/><polygon points="360,330 440,330 780,500 20,500" fill="#1a1226"/><line x1="400" y1="336" x2="400" y2="500" stroke="#ffd9a0" stroke-width="6" stroke-dasharray="26 22"/>'
    ),
  },
  {
    id: 'bike',
    name: '🏍️ Xe máy',
    svg: SV(
      '<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f766e"/><stop offset="1" stop-color="#134e4a"/></linearGradient></defs><rect width="800" height="500" fill="url(#a)"/><g fill="none" stroke="#ffffff" stroke-opacity=".38" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"><circle cx="250" cy="360" r="62"/><circle cx="560" cy="360" r="62"/><path d="M250 360 L330 260 L450 260 L500 320 L560 360 M330 260 L300 215 L360 205 M480 295 L520 215 L585 205 M330 300 L470 300"/></g><rect y="425" width="800" height="75" fill="#ffffff" fill-opacity=".1"/>'
    ),
  },
  {
    id: 'car',
    name: '🚗 Xe hơi',
    svg: SV(
      '<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#0b1330"/></linearGradient></defs><rect width="800" height="500" fill="url(#a)"/><g fill="#ffffff" fill-opacity=".3"><path d="M130 360 Q150 290 270 270 L420 262 Q520 262 570 320 L650 335 Q670 340 670 380 L670 400 L130 400 Z"/></g><g fill="#0b1330"><circle cx="270" cy="400" r="48"/><circle cx="540" cy="400" r="48"/></g><g fill="#ffffff" fill-opacity=".45"><circle cx="270" cy="400" r="22"/><circle cx="540" cy="400" r="22"/></g><rect y="445" width="800" height="55" fill="#ffffff" fill-opacity=".08"/>'
    ),
  },
  {
    id: 'city',
    name: '🌃 Đêm phố',
    svg: SV(
      '<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1026"/><stop offset="1" stop-color="#312e81"/></linearGradient></defs><rect width="800" height="500" fill="url(#a)"/><g fill="#0b1026"><rect x="20" y="240" width="90" height="260"/><rect x="120" y="170" width="70" height="330"/><rect x="200" y="280" width="100" height="220"/><rect x="310" y="130" width="80" height="370"/><rect x="400" y="220" width="110" height="280"/><rect x="520" y="150" width="70" height="350"/><rect x="600" y="260" width="90" height="240"/><rect x="700" y="190" width="80" height="310"/></g><g fill="#fde68a" fill-opacity=".8"><rect x="40" y="270" width="10" height="14"/><rect x="70" y="310" width="10" height="14"/><rect x="140" y="210" width="10" height="14"/><rect x="150" y="260" width="10" height="14"/><rect x="330" y="170" width="10" height="14"/><rect x="350" y="230" width="10" height="14"/><rect x="430" y="260" width="10" height="14"/><rect x="540" y="200" width="10" height="14"/><rect x="620" y="300" width="10" height="14"/><rect x="720" y="240" width="10" height="14"/></g>'
    ),
  },
  {
    id: 'red',
    name: '🔴 Tông đỏ',
    svg: SV(
      '<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8102e"/><stop offset="1" stop-color="#3a0610"/></linearGradient></defs><rect width="800" height="500" fill="url(#a)"/><g stroke="#fff" stroke-opacity=".12" stroke-width="30"><line x1="-50" y1="520" x2="450" y2="-20"/><line x1="150" y1="540" x2="650" y2="0"/><line x1="350" y1="560" x2="850" y2="20"/></g>'
    ),
  },
  {
    id: 'blue',
    name: '🔵 Tông xanh',
    svg: SV(
      '<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1747b3"/><stop offset="1" stop-color="#06183d"/></linearGradient></defs><rect width="800" height="500" fill="url(#a)"/><g stroke="#fff" stroke-opacity=".12" stroke-width="30"><line x1="-50" y1="520" x2="450" y2="-20"/><line x1="150" y1="540" x2="650" y2="0"/><line x1="350" y1="560" x2="850" y2="20"/></g>'
    ),
  },
  {
    id: 'green',
    name: '🟢 Tông lục',
    svg: SV(
      '<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15803d"/><stop offset="1" stop-color="#052e16"/></linearGradient></defs><rect width="800" height="500" fill="url(#a)"/><g stroke="#fff" stroke-opacity=".12" stroke-width="30"><line x1="-50" y1="520" x2="450" y2="-20"/><line x1="150" y1="540" x2="650" y2="0"/><line x1="350" y1="560" x2="850" y2="20"/></g>'
    ),
  },
];

export const DEF_MBTOKEN =
  'pk.eyJ1IjoibmFtbmFtOTM5MyIsImEiOiJjbXZ0NHJxbDYwMG9pMnhvbWJhbnc3eGY1In0.j5JGeIQO7ei6zLk6f3t9fQ';
export const DEF_CID =
  '1032619748060-172d176jjc9bkat78g547rt2vcen3t2c.apps.googleusercontent.com';
