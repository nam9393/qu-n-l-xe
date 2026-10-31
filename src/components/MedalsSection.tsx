import React, { useState, useEffect, useRef } from 'react';
import { Medal } from '../types';
import { fmtD, triggerBurst } from '../utils/calc';

interface MedalsSectionProps {
  medals: Medal[];
  hasVehicle: boolean;
}

export const MedalsSection: React.FC<MedalsSectionProps> = ({ medals, hasVehicle }) => {
  const [seenKeys, setSeenKeys] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('soxe_seen') || 'null') || [];
    } catch {
      return [];
    }
  });

  const firedKeysRef = useRef<Set<string>>(new Set());

  // Determine fresh medals
  const unlocked = medals.filter((m) => m.cur >= m.goal);
  const fresh = unlocked.filter((m) => !seenKeys.includes(m.fam + m.goal));

  useEffect(() => {
    if (!hasVehicle) return;
    const newToFire = fresh.filter((m) => !firedKeysRef.current.has(m.fam + m.goal));
    if (newToFire.length > 0) {
      newToFire.forEach((m) => firedKeysRef.current.add(m.fam + m.goal));
      setTimeout(triggerBurst, 80);
    }
  }, [fresh.length, hasVehicle]);

  const handleAcknowledge = () => {
    const updated = unlocked.map((m) => m.fam + m.goal);
    setSeenKeys(updated);
    try {
      localStorage.setItem('soxe_seen', JSON.stringify(updated));
    } catch {}
  };

  if (!hasVehicle) return null;

  const renderMedalCard = (m: Medal, isFresh = false) => {
    const ok = m.cur >= m.goal;
    const pc = Math.min(100, (m.cur / m.goal) * 100);

    return (
      <div
        key={m.fam + m.goal}
        className={`med ${ok ? 'ok' : 'lock'}${isFresh ? ' fresh' : ''}`}
        title={m.desc}
      >
        {ok && (
          <>
            <i className="sp s1">✦</i>
            <i className="sp s2">✧</i>
            <i className="sp s3">✦</i>
          </>
        )}
        <div className="i">{m.icon}</div>
        <b>{m.name}</b>
        <small>
          {ok ? 'Đã đạt' + (m.when ? ' · ' + fmtD(m.when) : '') : `${Math.min(m.cur, m.goal)}/${m.goal}`}
        </small>
        {!ok && (
          <div className="bar" style={{ height: '5px', margin: '4px 0 0' }}>
            <span style={{ width: `${pc}%`, background: 'var(--acc)' }} />
          </div>
        )}
      </div>
    );
  };

  const groups: [ 'fuel' | 'service' | 'gen', string ][] = [
    ['fuel', '⛽ Nhiên liệu'],
    ['service', '🔧 Bảo dưỡng'],
    ['gen', '🌟 Chung'],
  ];

  return (
    <>
      {fresh.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--gold)' }}>
          <h2>🎉 Huy chương mới!</h2>
          <div className="mgrid">{fresh.map((m) => renderMedalCard(m, true))}</div>
          <button
            type="button"
            id="mseen"
            className="pri"
            style={{ marginTop: '10px' }}
            onClick={handleAcknowledge}
          >
            Tuyệt vời!
          </button>
        </div>
      )}

      <div className="card">
        <h2>
          🏅 Huy chương ({unlocked.length}/{medals.length})
        </h2>
        {groups.map(([grpKey, label]) => {
          const list = medals
            .filter((m) => m.g === grpKey)
            .sort((p, q) => Number(q.cur >= q.goal) - Number(p.cur >= p.goal));
          const grpUnlocked = list.filter((m) => m.cur >= m.goal).length;

          return (
            <details key={grpKey} className="mg">
              <summary>
                {label} · {grpUnlocked}/{list.length}
              </summary>
              <div className="mgrid">{list.map((m) => renderMedalCard(m))}</div>
            </details>
          );
        })}
      </div>
    </>
  );
};
