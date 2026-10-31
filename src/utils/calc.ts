import { AppState, Entry, Medal, Part, PartInfo, Vehicle } from '../types';
import { FUEL_TYPES } from '../constants';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const money = (n: number) => Math.round(n).toLocaleString('vi-VN') + 'VNĐ';

export const num = (n: number) => Math.round(n * 10) / 10;

export const shortMoney = (n: number) =>
  n >= 1e6 ? num(n / 1e6) + ' tr' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n));

export const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
};

export const fmtD = (d: string) => d.split('-').reverse().join('/');

export const curOdoOf = (vid: string, vehicles: Vehicle[], entries: Entry[]): number => {
  const v = vehicles.find((x) => x.id === vid) || ({} as Vehicle);
  const odos = entries.filter((e) => e.v === vid && e.odo).map((e) => e.odo);
  return Math.max(v.odo || 0, ...odos, 0);
};

export const pIcon = (n: string): string => {
  const s = (n || '').toLowerCase();
  if (/nhớt|dầu|nhot/.test(s)) return '🛢️';
  if (/bugi/.test(s)) return '⚡';
  if (/lọc gió/.test(s)) return '🌬️';
  if (/lọc/.test(s)) return '🧴';
  if (/lốp|vỏ/.test(s)) return '🛞';
  if (/phanh|thắng/.test(s)) return '🛑';
  if (/ắc quy|bình điện|pin/.test(s)) return '🔋';
  if (/nước|làm mát/.test(s)) return '💧';
  if (/dây|xích|sên|curoa/.test(s)) return '⛓️';
  return '🔧';
};

export const partInfo = (p: Part, curOdo: number): PartInfo => {
  const base = p.pct == null ? 100 : p.pct;
  let pctK: number | null = null;
  let pctM: number | null = null;
  let dueOdo: number | null = null;
  let remK: number | null = null;
  let dueDate: Date | null = null;

  if (p.km > 0) {
    pctK = base - (Math.max(0, curOdo - (p.odo || 0)) / p.km) * 100;
    dueOdo = Math.round((p.odo || 0) + (base / 100) * p.km);
    remK = dueOdo - curOdo;
  }

  if (p.mo > 0 && p.date) {
    const t0 = new Date(p.date).getTime();
    pctM = base - ((Date.now() - t0) / (30.4375 * 864e5) / p.mo) * 100;
    dueDate = new Date(t0 + (base / 100) * p.mo * 30.4375 * 864e5);
  }

  const a = [pctK, pctM].filter((x): x is number => x != null);
  return {
    pct: a.length ? Math.min(...a) : null,
    dueOdo,
    remK,
    dueDate,
  };
};

export function measured(fl: Entry[]) {
  const fulls = fl.filter((e) => e.full);
  let km = 0;
  let lit = 0;
  let n = 0;
  for (let i = 1; i < fulls.length; i++) {
    const a = fulls[i - 1];
    const b = fulls[i];
    const d = b.odo - a.odo;
    if (d <= 0) continue;
    km += d;
    n++;
    const intermediateLiters = fl
      .filter((e) => e.odo > a.odo && e.odo <= b.odo)
      .reduce((s, e) => s + (e.liters || 0), 0);
    lit += intermediateLiters;
  }
  return { c: km && lit ? (lit / km) * 100 : 0, n };
}

export function levels(
  vid: string,
  vehicles: Vehicle[],
  entries: Entry[],
  extra?: Entry,
  skipId?: string | null
) {
  const v = vehicles.find((x) => x.id === vid);
  const tank = v ? +v.tank || 0 : 0;
  if (!tank) return { tank: 0, m: {}, lv: null, r: 0, po: 0 };

  const fl = entries.filter((e) => e.v === vid && e.type === 'fuel' && e.odo && e.id !== skipId);
  if (extra) fl.push(extra);
  fl.sort((a, b) => a.odo - b.odo || a.date.localeCompare(b.date));

  const ms = measured(fl);
  const off = +(v?.cons || 0);
  const r = ms.n >= 2 || !off ? ms.c : off;
  const m: Record<string, { after: number | null }> = {};
  let lv: number | null = null;
  let po = 0;

  fl.forEach((e) => {
    if (lv !== null) {
      lv = r ? Math.max(0, lv - ((e.odo - po) * r) / 100) : null;
    }
    if (e.full) {
      lv = tank;
    } else if (lv !== null) {
      lv = Math.min(tank, lv + (e.liters || 0));
    }
    m[e.id] = { after: lv };
    po = e.odo;
  });

  return { tank, m, lv, r, po };
}

export function inPeriod(d: string, per: string) {
  const t = today();
  if (per === 'all') return true;
  if (per === 'month') return d.slice(0, 7) === t.slice(0, 7);
  if (per === 'year') return d.slice(0, 4) === t.slice(0, 4);
  const lim = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  return d >= lim;
}

export function calculateStats(vid: string, per: string, entries: Entry[]) {
  const per_ = entries.filter((e) => e.v === vid && inPeriod(e.date, per));
  const out = per_.filter((e) => e.type !== 'income');
  const inc = per_.filter((e) => e.type === 'income');
  const sum = (a: Entry[]) => a.reduce((s, e) => s + e.amount, 0);

  const odos = per_.filter((e) => e.odo).map((e) => e.odo);
  const km = odos.length > 1 ? Math.max(...odos) - Math.min(...odos) : 0;
  const fl = per_.filter((e) => e.type === 'fuel' && e.odo).sort((a, b) => a.odo - b.odo);
  const fulls = fl.filter((e) => e.full);

  let cons = 0;
  if (fulls.length > 1) {
    const a = fulls[0];
    const b = fulls[fulls.length - 1];
    const lit = fl
      .filter((e) => e.odo > a.odo && e.odo <= b.odo)
      .reduce((s, e) => s + (e.liters || 0), 0);
    if (b.odo > a.odo) {
      cons = (lit / (b.odo - a.odo)) * 100;
    }
  }

  return {
    per_,
    tot: sum(out),
    inc: sum(inc),
    km,
    cons,
    cat: {
      fuel: sum(out.filter((e) => e.type === 'fuel')),
      service: sum(out.filter((e) => e.type === 'service')),
      other: sum(out.filter((e) => e.type === 'other')),
    },
  };
}

export function triggerBurst() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const d = document.createElement('div');
  const ch = ['✨', '⭐', '✦', '🌟', '🎉'];
  d.className = 'burst';
  for (let i = 0; i < 40; i++) {
    const e = document.createElement('i');
    const a = Math.random() * Math.PI * 2;
    const r = 120 + Math.random() * Math.min(window.innerWidth, 500) * 0.6;
    e.textContent = ch[i % ch.length];
    e.style.cssText = `--dx: ${Math.cos(a) * r}px; --dy: ${Math.sin(a) * r}px; font-size: ${
      12 + Math.random() * 18
    }px; animation-delay: ${Math.random() * 0.25}s;`;
    d.appendChild(e);
  }
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2400);
}

export function calculateMedals(state: AppState, bgMode: string): Medal[] {
  const E = state.entries;
  const byD = (a: Entry, b: Entry) => a.date.localeCompare(b.date);
  const fulls = E.filter((e) => e.type === 'fuel' && e.full).sort(byD);
  const svc = E.filter((e) => e.type === 'service').sort(byD);
  const ont = svc.filter((e) => e.ontime);
  const inc = E.filter((e) => e.type === 'income').sort(byD);
  const all = E.slice().sort(byD);

  const pl: Record<string, Entry[]> = {};
  E.filter((e) => e.type === 'fuel' && e.place).forEach((e) => {
    const k = e.place?.pid || e.place?.name || '';
    if (k) (pl[k] = pl[k] || []).push(e);
  });
  const top = Object.keys(pl)
    .map((k) => pl[k].sort(byD))
    .sort((a, b) => b.length - a.length)[0] || [];

  const d0 = all[0] ? all[0].date : null;
  const age = d0 ? Math.max(0, Math.floor((Date.now() - new Date(d0).getTime()) / 864e5)) : 0;
  const ageWhen = (n: number) =>
    d0 ? new Date(new Date(d0).getTime() + n * 864e5).toISOString().slice(0, 10) : null;

  const curVehicle = state.vehicles.find((v) => v.id === state.cur);
  const curVehicleParts = state.parts.filter((p) => p.v === state.cur);
  const vf = E.filter((e) => e.v === state.cur && e.type === 'fuel' && e.odo).sort(
    (a, b) => a.odo - b.odo
  );
  const m1 = measured(vf);
  const curOdo = curVehicle ? curOdoOf(curVehicle.id, state.vehicles, state.entries) : 0;
  const sv = curVehicle && +curVehicle.cons! && m1.n >= 3 && m1.c <= curVehicle.cons! ? 1 : 0;
  const healthy =
    curVehicleParts.length >= 3 &&
    curVehicleParts.every((p) => {
      const i = partInfo(p, curOdo);
      return i.pct != null && i.pct > 30;
    })
      ? 1
      : 0;

  const L: Medal[] = [];
  const tier = (n: number) => (n >= 50 ? '🏆' : n >= 25 ? '🥇' : n >= 10 ? '🥈' : '🥉');
  const add = (
    g: 'fuel' | 'service' | 'gen',
    fam: string,
    icon: string,
    name: string,
    desc: string,
    curVal: number,
    goal: number,
    when?: string | null
  ) => {
    L.push({ g, fam, icon, name, desc, cur: curVal, goal, when: when || null });
  };

  [1, 5, 10, 15, 25, 50].forEach((n) =>
    add(
      'fuel',
      'full',
      n === 1 ? '⛽' : tier(n),
      n === 1 ? 'Lần đổ đầy đầu tiên' : 'Đổ đầy bình ' + n + ' lần',
      'Đổ đầy bình ' + n + ' lần',
      fulls.length,
      n,
      fulls[n - 1] && fulls[n - 1].date
    )
  );

  [3, 5, 10].forEach((n) =>
    add(
      'fuel',
      'place',
      '📍',
      'Khách quen ' + n + ' lần',
      'Đổ xăng ' + n + ' lần ở cùng một cây xăng',
      top.length,
      n,
      top[n - 1] && top[n - 1].date
    )
  );

  add(
    'fuel',
    'save',
    '🌱',
    'Tiết kiệm xăng',
    'Tiêu hao thực tế thấp hơn hoặc bằng mức công bố (cần nhập mức công bố và ít nhất 3 khoảng đổ đầy)',
    sv,
    1
  );

  [1, 5, 10].forEach((n) =>
    add(
      'service',
      'svc',
      n === 1 ? '🔧' : tier(n),
      n === 1 ? 'Bảo dưỡng lần đầu' : 'Bảo dưỡng ' + n + ' lần',
      'Ghi ' + n + ' lần bảo dưỡng',
      svc.length,
      n,
      svc[n - 1] && svc[n - 1].date
    )
  );

  [1, 3, 10].forEach((n) =>
    add(
      'service',
      'ontime',
      '⏰',
      'Thay đúng hạn ' + n + ' lần',
      'Thay linh kiện khi chưa quá hạn, ' + n + ' lần',
      ont.length,
      n,
      ont[n - 1] && ont[n - 1].date
    )
  );

  [3, 5].forEach((n) =>
    add(
      'service',
      'parts',
      '🔩',
      'Theo dõi ' + n + ' linh kiện',
      'Thêm ' + n + ' linh kiện vào danh sách hạn thay',
      curVehicleParts.length,
      n
    )
  );

  add(
    'service',
    'healthy',
    '💚',
    'Xe khỏe mạnh',
    'Có ít nhất 3 linh kiện và tất cả còn trên 30%',
    healthy,
    1
  );

  [
    [7, '🌱', 'Tuần đầu tiên'],
    [30, '📅', '1 tháng đồng hành'],
    [100, '💯', '100 ngày đồng hành'],
    [365, '🎂', '1 năm đồng hành'],
  ].forEach((x) =>
    add(
      'gen',
      'age',
      x[1] as string,
      x[2] as string,
      'Dùng app ' + x[0] + ' ngày kể từ khoản đầu tiên',
      age,
      x[0] as number,
      ageWhen(x[0] as number)
    )
  );

  [10, 50, 100, 250].forEach((n) =>
    add(
      'gen',
      'ent',
      '📝',
      'Ghi chép ' + n + ' khoản',
      'Ghi tổng cộng ' + n + ' khoản',
      all.length,
      n,
      all[n - 1] && all[n - 1].date
    )
  );

  [1, 10].forEach((n) =>
    add(
      'gen',
      'inc',
      '💰',
      'Thu nhập ' + n + ' lần',
      'Ghi ' + n + ' khoản thu nhập',
      inc.length,
      n,
      inc[n - 1] && inc[n - 1].date
    )
  );

  const fuels = E.filter((e) => e.type === 'fuel');
  [20, 50, 100].forEach((n) =>
    add(
      'fuel',
      'fills',
      tier(n),
      'Đổ xăng ' + n + ' lần',
      'Ghi tổng cộng ' + n + ' lần đổ xăng',
      fuels.length,
      n,
      fuels.slice().sort(byD)[n - 1] && fuels.slice().sort(byD)[n - 1].date
    )
  );

  add(
    'fuel',
    'pin',
    '📌',
    'Ghim cây xăng đầu tiên',
    'Chọn cây xăng bằng bản đồ ở một lần đổ xăng',
    fuels.filter((e) => e.place).length,
    1
  );

  [3, 5, 10].forEach((n) =>
    add(
      'fuel',
      'explore',
      '🧭',
      'Khám phá ' + n + ' cây xăng',
      'Đổ xăng ở ' + n + ' cây xăng khác nhau',
      Object.keys(pl).length,
      n
    )
  );

  const sp: Record<string, Entry[]> = {};
  svc
    .filter((e) => e.place)
    .forEach((e) => {
      const k = e.place?.pid || e.place?.name || '';
      if (k) (sp[k] = sp[k] || []).push(e);
    });
  const topS = Object.keys(sp)
    .map((k) => sp[k])
    .sort((a, b) => b.length - a.length)[0] || [];

  [3, 5].forEach((n) =>
    add(
      'service',
      'shop',
      '🏬',
      'Thợ quen ' + n + ' lần',
      'Bảo dưỡng ' + n + ' lần ở cùng một showroom hoặc xưởng',
      topS.length,
      n,
      topS[n - 1] && topS[n - 1].date
    )
  );

  add(
    'service',
    'parts',
    '🧰',
    'Theo dõi 8 linh kiện',
    'Thêm 8 linh kiện vào danh sách hạn thay',
    curVehicleParts.length,
    8
  );

  const od = E.filter((e) => e.v === state.cur && e.odo).map((e) => e.odo);
  const kmT = od.length > 1 ? Math.max(...od) - Math.min(...od) : 0;
  [500, 1000, 5000, 10000, 20000, 50000].forEach((n) =>
    add(
      'gen',
      'km',
      '🛣️',
      n.toLocaleString('vi-VN') + ' km đã ghi',
      'Quãng đường đã ghi nhận đạt ' + n.toLocaleString('vi-VN') + ' km',
      kmT,
      n
    )
  );

  const ds = Array.from(new Set(all.map((e) => e.date))).sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  ds.forEach((d) => {
    const t = new Date(d).getTime();
    run = prev !== null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1;
    prev = t;
    best = Math.max(best, run);
  });

  [3, 7, 14, 30].forEach((n) =>
    add(
      'gen',
      'streak',
      '🔥',
      'Ghi chép liên tục ' + n + ' ngày',
      'Có khoản ghi mỗi ngày trong ' + n + ' ngày liên tiếp',
      best,
      n
    )
  );

  const tin = inc.reduce((s, e) => s + e.amount, 0);
  const tout = E.filter((e) => e.type !== 'income').reduce((s, e) => s + e.amount, 0);
  add('gen', 'profit', '📈', 'Có lãi', 'Tổng thu nhập lớn hơn tổng chi phí', tin > 0 && tin > tout ? 1 : 0, 1);
  add(
    'gen',
    'types',
    '🎯',
    'Đủ bộ 4 loại khoản',
    'Đã ghi đủ đổ xăng, bảo dưỡng, chi phí khác và thu nhập',
    new Set(E.map((e) => e.type)).size,
    4
  );
  [2, 3].forEach((n) =>
    add('gen', 'garage', '🏘️', 'Nhà có ' + n + ' xe', 'Quản lý ' + n + ' xe trong app', state.vehicles.length, n)
  );
  add('gen', 'bg', '🎨', 'Phong cách riêng', 'Đổi nền giao diện của app', bgMode !== 'none' ? 1 : 0, 1);

  return L;
}
