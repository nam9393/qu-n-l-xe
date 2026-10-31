import React, { useState } from 'react';
import { Entry, EntryType, Vehicle } from '../types';
import { ENTRY_TYPES, FUEL_TYPES } from '../constants';
import { fmtD, levels, money, num } from '../utils/calc';
import { triggerSkidEffect } from '../utils/sound';

interface HistoryListProps {
  currentVehicle: Vehicle | null;
  vehicles: Vehicle[];
  entries: Entry[];
  soundEnabled: boolean;
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  currentVehicle,
  vehicles,
  entries,
  soundEnabled,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  if (!currentVehicle) return null;

  const handleFilterClick = (f: string, e: React.MouseEvent<HTMLButtonElement>) => {
    setFilter(f);
    triggerSkidEffect(e.currentTarget, soundEnabled);
  };

  const toggleKey = (k: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const LV = levels(currentVehicle.id, vehicles, entries);

  const vehicleEntries = entries
    .filter((e) => e.v === currentVehicle.id && (filter === 'all' || e.type === filter))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.odo || 0) - (a.odo || 0));

  const years: Record<string, Record<string, Entry[]>> = {};
  vehicleEntries.forEach((e) => {
    const y = e.date.slice(0, 4);
    const m = e.date.slice(0, 7);
    years[y] = years[y] || {};
    (years[y][m] = years[y][m] || []).push(e);
  });

  const sumCategory = (arr: Entry[], type: EntryType) =>
    arr.filter((e) => e.type === type).reduce((sum, e) => sum + e.amount, 0);

  const filterTabs: [string, string][] = [
    ['all', '📋 Tất cả'],
    ['fuel', '⛽ Đổ xăng'],
    ['service', '🔧 Bảo dưỡng'],
    ['other', '🧾 Chi phí khác'],
    ['income', '💰 Thu nhập'],
  ];

  return (
    <details className="card fold" id="hd" open>
      <summary>
        <h2>🕘 Lịch sử</h2>
      </summary>

      <div className="tabs" id="hf">
        {filterTabs.map(([val, label]) => (
          <button
            key={val}
            type="button"
            data-hf={val}
            aria-pressed={val === filter}
            className={val === filter ? 'active' : ''}
            onClick={(e) => handleFilterClick(val, e)}
          >
            {label}
          </button>
        ))}
      </div>

      <div id="list">
        {Object.keys(years).length === 0 ? (
          <div className="empty">Chưa có khoản nào.</div>
        ) : (
          Object.keys(years)
            .sort()
            .reverse()
            .map((y) => {
              const months = years[y];
              const yearEntries = Object.values(months).flat();
              const yearExpense = yearEntries
                .filter((e) => e.type !== 'income')
                .reduce((s, e) => s + e.amount, 0);
              const yearIncome = yearEntries
                .filter((e) => e.type === 'income')
                .reduce((s, e) => s + e.amount, 0);
              const yKey = 'Y' + y;
              const isYearOpen = openKeys.has(yKey);

              return (
                <details
                  key={y}
                  className="yr"
                  open={isYearOpen}
                  onToggle={(e) => {
                    const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                    setOpenKeys((prev) => {
                      const next = new Set(prev);
                      if (isOpen) next.add(yKey);
                      else next.delete(yKey);
                      return next;
                    });
                  }}
                >
                  <summary>
                    <span className="st">📆 Năm {y}</span>
                    <span className="sm">
                      {yearEntries.length} khoản · <b>−{money(yearExpense)}</b>
                      {yearIncome > 0 && <b className="in"> +{money(yearIncome)}</b>}
                    </span>
                    <span className="ch2">
                      {(['fuel', 'service', 'other', 'income'] as EntryType[]).map((t) => {
                        const c = sumCategory(yearEntries, t);
                        if (!c) return null;
                        return (
                          <span
                            key={t}
                            className="ch"
                            style={{ color: `var(${ENTRY_TYPES[t].varColor})` }}
                          >
                            {ENTRY_TYPES[t].icon} {t === 'income' ? '+' : ''}
                            {money(c)}
                          </span>
                        );
                      })}
                    </span>
                  </summary>

                  {Object.keys(months)
                    .sort()
                    .reverse()
                    .map((mKey) => {
                      const monthEntries = months[mKey];
                      const monthExpense = monthEntries
                        .filter((e) => e.type !== 'income')
                        .reduce((s, e) => s + e.amount, 0);
                      const monthIncome = monthEntries
                        .filter((e) => e.type === 'income')
                        .reduce((s, e) => s + e.amount, 0);
                      const isMonthOpen = openKeys.has(mKey);

                      return (
                        <details
                          key={mKey}
                          className="mg"
                          open={isMonthOpen}
                          onToggle={(e) => {
                            const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                            setOpenKeys((prev) => {
                              const next = new Set(prev);
                              if (isOpen) next.add(mKey);
                              else next.delete(mKey);
                              return next;
                            });
                          }}
                        >
                          <summary>
                            <span className="st">
                              📅 Tháng {mKey.slice(5)}/{y}
                            </span>
                            <span className="sm">
                              {monthEntries.length} khoản · <b>−{money(monthExpense)}</b>
                              {monthIncome > 0 && <b className="in"> +{money(monthIncome)}</b>}
                            </span>
                            <span className="ch2">
                              {(['fuel', 'service', 'other', 'income'] as EntryType[]).map((t) => {
                                const c = sumCategory(monthEntries, t);
                                if (!c) return null;
                                return (
                                  <span
                                    key={t}
                                    className="ch"
                                    style={{ color: `var(${ENTRY_TYPES[t].varColor})` }}
                                  >
                                    {ENTRY_TYPES[t].icon} {t === 'income' ? '+' : ''}
                                    {money(c)}
                                  </span>
                                );
                              })}
                            </span>
                          </summary>

                          {monthEntries.map((e) => {
                            const T = ENTRY_TYPES[e.type];
                            const isInc = e.type === 'income';
                            const subParts: string[] = [
                              fmtD(e.date),
                              e.odo ? `${e.odo.toLocaleString('vi-VN')} km` : '',
                            ];

                            if (e.type === 'fuel' && e.liters) {
                              let fuelDetails = `${num(e.liters)} L`;
                              if (e.price) fuelDetails += ` · ${money(e.price)}/L`;
                              if (e.ft && FUEL_TYPES[e.ft]) fuelDetails += ` · ${FUEL_TYPES[e.ft][1]}`;
                              if (e.full) fuelDetails += ` · đầy bình`;
                              if (
                                LV.tank &&
                                LV.m &&
                                LV.m[e.id] &&
                                LV.m[e.id].after !== null
                              ) {
                                fuelDetails += ` · sau đổ ~${Math.round(
                                  (LV.m[e.id].after! / LV.tank) * 100
                                )}%`;
                              }
                              subParts.push(fuelDetails);
                            }

                            if (e.place?.name) {
                              subParts.push(`📍 ${e.place.name}`);
                            }

                            const sub = subParts.filter(Boolean).join(' · ');

                            return (
                              <div key={e.id} className="item">
                                <span
                                  className="tag"
                                  style={{ background: `var(${T.varColor})` }}
                                />
                                <div className="t">
                                  <b>
                                    {T.icon} {e.note || T.label}
                                  </b>
                                  <small>
                                    {T.label} · {sub}
                                  </small>
                                </div>
                                <span
                                  className="amt"
                                  style={{ color: `var(${T.varColor})` }}
                                >
                                  {isInc ? '+' : '−'}
                                  {money(e.amount)}
                                </span>
                                <button
                                  type="button"
                                  className="lnk"
                                  data-edit={e.id}
                                  aria-label="Sửa khoản này"
                                  onClick={() => onEditEntry(e)}
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  className="lnk"
                                  data-del={e.id}
                                  aria-label="Xóa khoản này"
                                  onClick={() => onDeleteEntry(e.id)}
                                >
                                  Xóa
                                </button>
                              </div>
                            );
                          })}
                        </details>
                      );
                    })}
                </details>
              );
            })
        )}
      </div>
    </details>
  );
};
