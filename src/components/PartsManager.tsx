import React, { useState } from 'react';
import { Part } from '../types';
import { COMMON_PART_NAMES } from '../constants';
import { partInfo, pIcon, today, uid } from '../utils/calc';

interface PartsManagerProps {
  vehicleId: string;
  parts: Part[];
  curOdo: number;
  onSavePart: (part: Part) => void;
  onDeletePart: (partId: string) => void;
  onReplacePart: (partId: string) => void;
}

export const PartsManager: React.FC<PartsManagerProps> = ({
  vehicleId,
  parts,
  curOdo,
  onSavePart,
  onDeletePart,
  onReplacePart,
}) => {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editPartId, setEditPartId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [km, setKm] = useState<number | ''>('');
  const [mo, setMo] = useState<number | ''>('');
  const [odo, setOdo] = useState<number | ''>('');
  const [date, setDate] = useState(today());
  const [pct, setPct] = useState<number>(100);

  const vehicleParts = parts.filter((p) => p.v === vehicleId);

  const handleOpenAdd = () => {
    setEditPartId(null);
    setName('');
    setKm('');
    setMo('');
    setOdo(curOdo);
    setDate(today());
    setPct(100);
    setIsOpenForm(true);
  };

  const handleOpenEdit = (p: Part) => {
    setEditPartId(p.id);
    setName(p.name);
    setKm(p.km || '');
    setMo(p.mo || '');
    setOdo(p.odo != null ? p.odo : '');
    setDate(p.date || today());
    setPct(p.pct != null ? p.pct : 100);
    setIsOpenForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const kmNum = typeof km === 'number' ? km : 0;
    const moNum = typeof mo === 'number' ? mo : 0;
    if (!trimmedName || (!kmNum && !moNum)) return;

    const newPart: Part = {
      id: editPartId || uid(),
      v: vehicleId,
      name: trimmedName,
      km: kmNum,
      mo: moNum,
      odo: typeof odo === 'number' ? odo : curOdo,
      date: date || today(),
      pct: Math.max(0, Math.min(100, pct)),
      u: Date.now(),
    };

    onSavePart(newPart);
    setIsOpenForm(false);
    setEditPartId(null);
  };

  return (
    <div id="parts" style={{ borderTop: '1px solid var(--line)', marginTop: '14px', paddingTop: '12px' }}>
      <h2>🔩 Linh kiện và hạn thay</h2>

      {vehicleParts.length === 0 ? (
        <p className="empty" style={{ margin: '0 0 8px' }}>
          Chưa có linh kiện nào. Thêm nhớt, bugi, lọc gió… để theo dõi % còn lại và mốc km cần thay.
        </p>
      ) : (
        vehicleParts.map((p) => {
          const info = partInfo(p, curOdo);
          const pc = info.pct == null ? null : Math.max(0, Math.min(100, info.pct));
          const c = pc == null ? '--line' : pc <= 15 ? '--out' : pc <= 30 ? '--fuel' : '--in';
          const when = [
            info.dueOdo != null
              ? info.remK! > 0
                ? `thay ở ~${info.dueOdo.toLocaleString('vi-VN')} km (còn ~${info.remK!.toLocaleString('vi-VN')} km)`
                : `đã quá hạn ${(-info.remK!).toLocaleString('vi-VN')} km`
              : '',
            info.dueDate ? `hạn ${info.dueDate.toLocaleDateString('vi-VN')}` : '',
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <div key={p.id} className="item" style={{ alignItems: 'flex-start' }}>
              <div className="t">
                <b>
                  {pIcon(p.name)} {p.name}
                </b>
                <small>{when || 'Chưa đặt chu kỳ'}</small>
                {pc != null && (
                  <div className="bar" style={{ height: '10px', margin: '6px 0 0' }}>
                    <span style={{ width: `${pc}%`, background: `var(${c})` }} />
                  </div>
                )}
              </div>
              <b style={{ minWidth: '44px', textAlign: 'right' }}>
                {pc == null ? '–' : Math.round(pc) + '%'}
              </b>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  type="button"
                  className="lnk"
                  data-prep={p.id}
                  onClick={() => onReplacePart(p.id)}
                >
                  ✅ Đã thay
                </button>
                <button
                  type="button"
                  className="lnk"
                  data-pedit={p.id}
                  onClick={() => handleOpenEdit(p)}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="lnk"
                  data-pdel={p.id}
                  onClick={() => onDeletePart(p.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          );
        })
      )}

      {isOpenForm ? (
        <form id="pf" onSubmit={handleSubmit} style={{ marginTop: '10px' }}>
          <label className="full">
            Tên linh kiện
            <input
              id="p_name"
              list="pnames"
              required
              placeholder="Nhớt, bugi, lọc gió…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <datalist id="pnames">
            {COMMON_PART_NAMES.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <label>
            📏 Chu kỳ thay (km)
            <input
              id="p_km"
              type="number"
              min="0"
              placeholder="Ví dụ 2000"
              value={km}
              onChange={(e) => setKm(e.target.value === '' ? '' : +e.target.value)}
            />
          </label>
          <label>
            📅 Chu kỳ thay (tháng, nếu có)
            <input
              id="p_mo"
              type="number"
              min="0"
              placeholder="Ví dụ 6"
              value={mo}
              onChange={(e) => setMo(e.target.value === '' ? '' : +e.target.value)}
            />
          </label>
          <label>
            🛣️ Tại km
            <input
              id="p_odo"
              type="number"
              min="0"
              placeholder="Bỏ trống = km hiện tại"
              value={odo}
              onChange={(e) => setOdo(e.target.value === '' ? '' : +e.target.value)}
            />
          </label>
          <label>
            📅 Vào ngày
            <input
              id="p_date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="full">
            % còn lại tại thời điểm trên (100 = mới thay, nhập số bạn kiểm tra thực tế)
            <input
              id="p_pct"
              type="number"
              min="0"
              max="100"
              value={pct}
              onChange={(e) => setPct(+e.target.value)}
            />
          </label>
          <div className="full row">
            <button className="pri" type="submit">
              Lưu linh kiện
            </button>
            <button
              type="button"
              id="pcancel"
              onClick={() => {
                setIsOpenForm(false);
                setEditPartId(null);
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <button type="button" id="padd" onClick={handleOpenAdd} style={{ marginTop: '8px' }}>
          ➕ Thêm linh kiện
        </button>
      )}
    </div>
  );
};
