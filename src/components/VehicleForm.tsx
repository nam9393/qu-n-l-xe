import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { COMMON_BRANDS } from '../constants';
import { uid } from '../utils/calc';

interface VehicleFormProps {
  vehicleToEdit: Vehicle | null;
  isOpen: boolean;
  onSave: (vehicle: Vehicle, isEdit: boolean) => void;
  onCancel: () => void;
  canCancel: boolean;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  vehicleToEdit,
  isOpen,
  onSave,
  onCancel,
  canCancel,
}) => {
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [odo, setOdo] = useState<number | ''>('');
  const [tank, setTank] = useState<number | ''>('');
  const [cons, setCons] = useState<number | ''>('');
  const [brand, setBrand] = useState('');

  useEffect(() => {
    if (vehicleToEdit) {
      setName(vehicleToEdit.name || '');
      setPlate(vehicleToEdit.plate || '');
      setOdo(vehicleToEdit.odo != null ? vehicleToEdit.odo : '');
      setTank(vehicleToEdit.tank != null ? vehicleToEdit.tank : '');
      setCons(vehicleToEdit.cons != null ? vehicleToEdit.cons : '');
      setBrand(vehicleToEdit.brand || '');
    } else {
      setName('');
      setPlate('');
      setOdo('');
      setTank('');
      setCons('');
      setBrand('');
    }
  }, [vehicleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const vehicleData: Vehicle = {
      id: vehicleToEdit ? vehicleToEdit.id : uid(),
      name: name.trim(),
      plate: plate.trim() || undefined,
      odo: typeof odo === 'number' ? odo : undefined,
      tank: typeof tank === 'number' ? tank : undefined,
      cons: typeof cons === 'number' ? cons : undefined,
      brand: brand.trim() || undefined,
      u: Date.now(),
    };

    onSave(vehicleData, !!vehicleToEdit);
  };

  return (
    <div id="vform" className="card">
      <h2 id="vh">{vehicleToEdit ? '✏️ Sửa xe' : '🚗 Thêm xe'}</h2>
      <form id="vf" onSubmit={handleSubmit}>
        <label className="full">
          Tên xe
          <input
            id="vn"
            required
            placeholder="Ví dụ: Honda Vision, Mazda CX90"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <label>
          Biển số
          <input
            id="vp"
            placeholder="61K-123.45, 61D1-123.45"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
        </label>
        <label>
          Số km hiện tại
          <input
            id="vo"
            type="number"
            min="0"
            placeholder="0"
            value={odo}
            onChange={(e) => setOdo(e.target.value === '' ? '' : +e.target.value)}
          />
        </label>
        <label>
          🛢️ Dung tích bình xăng (lít)
          <input
            id="vt"
            type="number"
            step="0.1"
            min="0"
            placeholder="Ví dụ 5.5"
            value={tank}
            onChange={(e) => setTank(e.target.value === '' ? '' : +e.target.value)}
          />
        </label>
        <label>
          ⛽ Tiêu hao công bố (L/100km)
          <input
            id="vc"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ví dụ 1.9"
            value={cons}
            onChange={(e) => setCons(e.target.value === '' ? '' : +e.target.value)}
          />
        </label>
        <label className="full">
          🏷️ Hãng xe (để tìm showroom gần bạn)
          <input
            id="vb"
            list="vbrands"
            placeholder="Honda, Yamaha, Toyota, VinFast…"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </label>
        <datalist id="vbrands">
          {COMMON_BRANDS.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        <div className="full row">
          <button className="pri" type="submit">
            Lưu xe
          </button>
          {canCancel && (
            <button type="button" id="vcancel" onClick={onCancel}>
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
