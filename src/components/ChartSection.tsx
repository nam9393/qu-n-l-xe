import React, { useState } from 'react';
import { Entry } from '../types';
import { ENTRY_TYPES } from '../constants';
import { money, num, shortMoney, today } from '../utils/calc';
import { triggerSkidEffect } from '../utils/sound';

interface ChartSectionProps {
  entries: Entry[];
  vehicleId: string;
  soundEnabled: boolean;
}

export const ChartSection: React.FC<ChartSectionProps> = ({
  entries,
  vehicleId,
  soundEnabled,
}) => {
  const [cmode, setCmode] = useState<'6m' | 'month' | 'year'>('6m');
  const [cmonth, setCmonth] = useState(today().slice(0, 7));
  const [cyear, setCyear] = useState(today().slice(0, 4));
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const now = new Date();
  const buckets: { k: string; l: string }[] = [];
  let keyLength = 7;

  if (cmode === 'year') {
    for (let m = 1; m <= 12; m++) {
      buckets.push({ k: `${cyear}-${String(m).padStart(2, '0')}`, l: `T${m}` });
    }
  } else if (cmode === 'month') {
    keyLength = 10;
    const [y, m] = cmonth.split('-').map(Number);
    const numDays = new Date(y, m, 0).getDate();
    for (let d = 1; d <= numDays; d++) {
      buckets.push({ k: `${cmonth}-${String(d).padStart(2, '0')}`, l: String(d) });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        k: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        l: `T${d.getMonth() + 1}`,
      });
    }
  }

  const keysSet = new Set(buckets.map((x) => x.k));
  const vehicleEntries = entries.filter(
    (e) => e.v === vehicleId && keysSet.has(e.date.slice(0, keyLength))
  );

  const data = buckets.map((x) => {
    const f = vehicleEntries.filter((e) => e.date.slice(0, keyLength) === x.k);
    return {
      l: x.l,
      i: f.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0),
      o: f.filter((e) => e.type !== 'income').reduce((s, e) => s + e.amount, 0),
    };
  });

  const catSum = {
    fuel: vehicleEntries.filter((e) => e.type === 'fuel').reduce((s, e) => s + e.amount, 0),
    service: vehicleEntries.filter((e) => e.type === 'service').reduce((s, e) => s + e.amount, 0),
    other: vehicleEntries.filter((e) => e.type === 'other').reduce((s, e) => s + e.amount, 0),
  };

  const totalIncome = data.reduce((s, d) => s + d.i, 0);
  const totalOut = data.reduce((s, d) => s + d.o, 0);
  const net = totalIncome - totalOut;

  const years = Array.from(
    new Set(
      entries
        .map((e) => e.date.slice(0, 4))
        .concat([today().slice(0, 4), cyear])
    )
  )
    .sort()
    .reverse();

  const ttl =
    cmode === '6m'
      ? '6 tháng gần nhất'
      : cmode === 'year'
      ? `năm ${cyear}`
      : `tháng ${cmonth.split('-').reverse().join('/')}`;

  const renderDonut = (slices: { v: number; c: string }[], center: string) => {
    const tot = slices.reduce((t, x) => t + x.v, 0);
    const R = 40;
    const C = 2 * Math.PI * R;
    let off = 0;
    let circles: React.ReactNode[] = [];

    if (!tot) {
      circles.push(
        <circle
          key="empty"
          cx="60"
          cy="60"
          r={R}
          fill="none"
          strokeWidth="20"
          style={{ stroke: 'var(--line)' }}
        />
      );
    } else {
      slices.forEach((x, idx) => {
        if (!x.v) return;
        const len = (x.v / tot) * C;
        circles.push(
          <circle
            key={idx}
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="20"
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-off}
            transform="rotate(-90 60 60)"
            style={{ stroke: `var(${x.c})` }}
          />
        );
        off += len;
      });
    }

    return (
      <svg viewBox="0 0 120 120" style={{ maxWidth: '150px', margin: '0 auto' }}>
        {circles}
        <text
          x="60"
          y="64"
          textAnchor="middle"
          style={{ fontSize: '12px', fontWeight: 700, fill: 'var(--ink)' }}
        >
          {center}
        </text>
      </svg>
    );
  };

  const handleChartTypeChange = (ct: 'bar' | 'line' | 'pie', e: React.MouseEvent<HTMLButtonElement>) => {
    setChartType(ct);
    triggerSkidEffect(e.currentTarget, soundEnabled);
  };

  const W = 360;
  const H = 150;
  const mx = Math.max(1, ...data.flatMap((d) => [d.i, d.o]));
  const slotWidth = W / data.length;
  const barW = Math.max(2, Math.min(16, slotWidth * 0.38));

  return (
    <div className="card">
      <h2>📊 Báo cáo thu chi</h2>

      <div className="row" style={{ marginBottom: '8px' }}>
        <select
          id="cmode"
          aria-label="Khoảng thời gian"
          value={cmode}
          onChange={(e) => setCmode(e.target.value as any)}
        >
          <option value="6m">6 tháng gần nhất</option>
          <option value="month">Theo tháng</option>
          <option value="year">Theo năm</option>
        </select>

        {cmode === 'month' && (
          <input
            id="cmo"
            type="month"
            value={cmonth}
            aria-label="Chọn tháng"
            onChange={(e) => setCmonth(e.target.value)}
          />
        )}

        {cmode === 'year' && (
          <select
            id="cyr"
            aria-label="Chọn năm"
            value={cyear}
            onChange={(e) => setCyear(e.target.value)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: '10px' }}>
        {[
          ['bar', '📊 Cột'],
          ['line', '📈 Đường'],
          ['pie', '🥧 Tròn'],
        ].map(([typeVal, label]) => (
          <button
            key={typeVal}
            type="button"
            data-ct={typeVal}
            aria-pressed={chartType === typeVal}
            className={chartType === typeVal ? 'active' : ''}
            onClick={(e) => handleChartTypeChange(typeVal as any, e)}
          >
            {label}
          </button>
        ))}
      </div>

      {chartType === 'pie' ? (
        <div className="donuts">
          <div>
            {renderDonut(
              [
                { v: catSum.fuel, c: '--fuel' },
                { v: catSum.service, c: '--svc' },
                { v: catSum.other, c: '--oth' },
              ],
              shortMoney(totalOut)
            )}
            <div className="dl">
              {(['fuel', 'service', 'other'] as const).map((k) => (
                <div key={k}>
                  <i className="dot" style={{ background: `var(${ENTRY_TYPES[k].varColor})` }} />
                  {ENTRY_TYPES[k].icon} {ENTRY_TYPES[k].label}
                  <br />
                  <b>{money(catSum[k])}</b> ·{' '}
                  {totalOut ? Math.round((catSum[k] / totalOut) * 100) : 0}%
                </div>
              ))}
            </div>
            <small style={{ color: 'var(--mut)' }}>Cơ cấu chi phí {ttl}</small>
          </div>

          <div>
            {renderDonut(
              [
                { v: totalIncome, c: '--in' },
                { v: totalOut, c: '--out' },
              ],
              (net >= 0 ? '+' : '−') + shortMoney(Math.abs(net))
            )}
            <div className="dl">
              <div>
                <i className="dot" style={{ background: 'var(--in)' }} />
                💰 Thu
                <br />
                <b>{money(totalIncome)}</b>
              </div>
              <div>
                <i className="dot" style={{ background: 'var(--out)' }} />
                💸 Chi
                <br />
                <b>{money(totalOut)}</b>
              </div>
            </div>
            <small style={{ color: 'var(--mut)' }}>Thu và chi {ttl}</small>
          </div>
        </div>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Biểu đồ thu và chi ${ttl}`}>
            {chartType === 'line' ? (
              <>
                {[0, 0.5, 1].map((f) => (
                  <line
                    key={f}
                    x1="0"
                    x2={W}
                    y1={H - 24 - f * 105}
                    y2={H - 24 - f * 105}
                    strokeWidth="0.5"
                    style={{ stroke: 'var(--line)' }}
                  />
                ))}

                {(['i', 'o'] as const).map((k) => {
                  const col = k === 'i' ? '--in' : '--out';
                  const points = data
                    .map((d, j) => `${(j + 0.5) * slotWidth},${H - 24 - (d[k] / mx) * 105}`)
                    .join(' ');
                  return (
                    <g key={k}>
                      <polyline
                        points={points}
                        fill="none"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        style={{ stroke: `var(${col})` }}
                      />
                      {data.length <= 12 &&
                        data.map((d, j) => (
                          <circle
                            key={j}
                            cx={(j + 0.5) * slotWidth}
                            cy={H - 24 - (d[k] / mx) * 105}
                            r="2.8"
                            style={{ fill: `var(${col})` }}
                          />
                        ))}
                    </g>
                  );
                })}

                {data.map((d, j) =>
                  cmode !== 'month' || j % 5 === 0 || j === data.length - 1 ? (
                    <text
                      key={j}
                      x={(j + 0.5) * slotWidth}
                      y={H - 8}
                      textAnchor="middle"
                    >
                      {d.l}
                    </text>
                  ) : null
                )}
              </>
            ) : (
              <>
                {data.map((d, j) => {
                  const x = (j + 0.5) * slotWidth - barW;
                  const hi = (d.i / mx) * 105;
                  const ho = (d.o / mx) * 105;
                  return (
                    <g key={j}>
                      <rect
                        x={x}
                        y={H - 24 - hi}
                        width={barW}
                        height={hi}
                        rx="1.5"
                        style={{ fill: 'var(--in)' }}
                      />
                      <rect
                        x={x + barW}
                        y={H - 24 - ho}
                        width={barW}
                        height={ho}
                        rx="1.5"
                        style={{ fill: 'var(--out)' }}
                      />
                      {(cmode !== 'month' || j % 5 === 0 || j === data.length - 1) && (
                        <text
                          x={(j + 0.5) * slotWidth}
                          y={H - 8}
                          textAnchor="middle"
                        >
                          {d.l}
                        </text>
                      )}
                    </g>
                  );
                })}
              </>
            )}
          </svg>

          <div className="leg" style={{ marginTop: '6px' }}>
            <span>
              <i className="dot" style={{ background: 'var(--in)' }} />
              💰 Thu <b>{money(totalIncome)}</b>
            </span>
            <span>
              <i className="dot" style={{ background: 'var(--out)' }} />
              💸 Chi <b>{money(totalOut)}</b>
            </span>
            <span>
              {net >= 0 ? '📈 Lãi' : '📉 Lỗ'}{' '}
              <b className={net >= 0 ? 'in' : 'out'}>{money(Math.abs(net))}</b>
            </span>
          </div>

          <h3 style={{ margin: '14px 0 4px', fontSize: '14px' }}>Chi phí theo loại</h3>
          <div className="bar">
            {totalOut > 0 &&
              (['fuel', 'service', 'other'] as const).map((k) => (
                <span
                  key={k}
                  style={{
                    width: `${(catSum[k] / totalOut) * 100}%`,
                    background: `var(${ENTRY_TYPES[k].varColor})`,
                  }}
                />
              ))}
          </div>

          <div
            className="dl"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '6px' }}
          >
            {(['fuel', 'service', 'other'] as const).map((k) => (
              <div key={k}>
                <i className="dot" style={{ background: `var(${ENTRY_TYPES[k].varColor})` }} />
                {ENTRY_TYPES[k].icon} {ENTRY_TYPES[k].label}
                <br />
                <b>{money(catSum[k])}</b> ·{' '}
                {totalOut ? Math.round((catSum[k] / totalOut) * 100) : 0}%
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
