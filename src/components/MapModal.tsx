import React, { useState, useEffect, useRef } from 'react';
import { Place } from '../types';
import { COMMON_BRANDS, DEF_MBTOKEN } from '../constants';

interface MapModalProps {
  isOpen: boolean;
  mode: 'fuel' | 'dealer';
  defaultBrand?: string;
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  lastSelectedPlace?: Place | null;
}

const MBV = 'v2.15.0';
const BADTOK = 'Mapbox từ chối token này. Kiểm tra token công khai (bắt đầu bằng pk.) và giới hạn URL.';
const ME_SVG =
  '<span class="pulse"></span><svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 1C7.3 1 1.5 6.9 1.5 14.2 1.5 24 15 39 15 39s13.5-15 13.5-24.8C28.5 6.9 22.7 1 15 1z" fill="#1a73e8" stroke="#fff" stroke-width="2"/><circle cx="15" cy="14" r="5" fill="#fff"/></svg>';

function loadMB(): Promise<void> {
  return new Promise((res, rej) => {
    const win = window as any;
    if (win.mapboxgl) return res();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://api.mapbox.com/mapbox-gl-js/' + MBV + '/mapbox-gl.css';
    document.head.appendChild(l);
    const sc = document.createElement('script');
    sc.src = 'https://api.mapbox.com/mapbox-gl-js/' + MBV + '/mapbox-gl.js';
    sc.onload = () => res();
    sc.onerror = () => rej(new Error('load'));
    document.head.appendChild(sc);
  });
}

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  mode,
  defaultBrand = '',
  onClose,
  onSelectPlace,
  lastSelectedPlace,
}) => {
  const [token, setToken] = useState<string>(() => {
    try {
      return localStorage.getItem('soxe_mbtoken') || DEF_MBTOKEN;
    } catch {
      return DEF_MBTOKEN;
    }
  });
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenBox, setShowTokenBox] = useState(false);
  const [brand, setBrand] = useState(defaultBrand);
  const [statusMsg, setStatusMsg] = useState('');
  const [placeList, setPlaceList] = useState<Place[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const meMarkerRef = useRef<any>(null);
  const myPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (defaultBrand) setBrand(defaultBrand);
  }, [defaultBrand]);

  const stopWatch = () => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const setMe = (lat: number, lng: number) => {
    myPosRef.current = { lat, lng };
    const win = window as any;
    if (!mapRef.current || !win.mapboxgl) return;
    if (!meMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'me-pin';
      el.title = 'Vị trí của bạn';
      el.innerHTML = ME_SVG;
      meMarkerRef.current = new win.mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    } else {
      meMarkerRef.current.setLngLat([lng, lat]);
    }
  };

  const getPos = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((res) => {
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res(null),
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  const startWatch = () => {
    if (!navigator.geolocation || watchIdRef.current != null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (p) => setMe(p.coords.latitude, p.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  };

  const sbFetch = async (path: string) => {
    const c = mapRef.current.getCenter();
    const b = mapRef.current.getBounds();
    const base = `https://api.mapbox.com/search/searchbox/v1/${path}${
      path.indexOf('?') >= 0 ? '&' : '?'
    }access_token=${encodeURIComponent(token)}&language=vi&proximity=${c.lng},${c.lat}`;
    let r = await fetch(
      `${base}&bbox=${[b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(',')}`
    );
    if (!r.ok && r.status !== 401 && r.status !== 403) {
      r = await fetch(base);
    }
    if (r.status === 401 || r.status === 403) throw new Error('auth');
    if (!r.ok) throw new Error('http' + r.status);
    return (await r.json()).features || [];
  };

  const findStations = async () => {
    const isDealer = mode === 'dealer';
    const trimmedBrand = brand.trim();
    if (isDealer && !trimmedBrand) {
      setStatusMsg('Nhập hãng xe (ví dụ Honda, Yamaha, Toyota) rồi bấm Tìm showroom.');
      return;
    }

    setStatusMsg(isDealer ? `Đang tìm showroom ${trimmedBrand}…` : 'Đang tìm cây xăng…');

    try {
      const fs = isDealer
        ? (
            await Promise.all([
              sbFetch(`forward?types=poi&limit=10&q=${encodeURIComponent(trimmedBrand)}`),
              sbFetch(`forward?types=poi&limit=10&q=${encodeURIComponent(trimmedBrand + ' showroom')}`),
            ])
          ).flat()
        : await sbFetch('category/gas_station?limit=25');

      const seen = new Set<string>();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const parsed: Place[] = fs
        .map((f: any) => ({
          pid: f.properties?.mapbox_id || '',
          name: f.properties?.name || (isDealer ? 'Showroom' : 'Cây xăng'),
          addr: f.properties?.full_address || f.properties?.address || '',
          lng: f.geometry?.coordinates[0],
          lat: f.geometry?.coordinates[1],
        }))
        .filter((pl: Place) => {
          const k = pl.pid || pl.name + pl.lat + pl.lng;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

      setPlaceList(parsed);
      const win = window as any;
      const ic = isDealer ? '🏬' : '⛽';

      if (win.mapboxgl && mapRef.current) {
        parsed.forEach((pl) => {
          const el = document.createElement('div');
          el.textContent = ic;
          el.title = pl.name;
          el.style.cssText = 'font-size:24px;cursor:pointer;line-height:1';
          el.onclick = (ev) => {
            ev.stopPropagation();
            stopWatch();
            onSelectPlace(pl);
          };
          markersRef.current.push(
            new win.mapboxgl.Marker({ element: el }).setLngLat([pl.lng, pl.lat]).addTo(mapRef.current)
          );
        });
      }

      setStatusMsg(
        parsed.length
          ? `Tìm thấy ${parsed.length} ${isDealer ? 'địa điểm' : 'cây xăng'} trong khu vực đang xem. Bấm biểu tượng ${ic} hoặc danh sách để chọn.`
          : isDealer
          ? `Không thấy showroom ${trimmedBrand} trong khu vực này. Hãy thu nhỏ hoặc kéo bản đồ rồi tìm lại.`
          : 'Không có cây xăng nào trong khu vực này. Hãy kéo hoặc thu nhỏ bản đồ rồi bấm tìm lại.'
      );
    } catch (e: any) {
      setStatusMsg(e?.message === 'auth' ? BADTOK : 'Không tìm được. Kiểm tra mạng và token Mapbox.');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopWatch();
      return;
    }

    if (!token) {
      setShowTokenBox(true);
      setStatusMsg('Cần Mapbox token công khai (bắt đầu bằng pk.) để dùng bản đồ.');
      return;
    }

    let isMounted = true;
    (async () => {
      setStatusMsg('Đang tải bản đồ và xác định vị trí của bạn…');
      try {
        await loadMB();
        if (!isMounted) return;
        const win = window as any;
        win.mapboxgl.accessToken = token;

        if (!mapRef.current && mapContainerRef.current) {
          const pos = await getPos();
          const lp = lastSelectedPlace;
          const dk = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

          const map = new win.mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/' + (dk ? 'dark-v11' : 'streets-v12'),
            center: pos ? [pos.lng, pos.lat] : lp ? [lp.lng, lp.lat] : [106.7009, 10.7769],
            zoom: 14,
          });

          map.addControl(new win.mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
          map.on('error', (e: any) => {
            const st = e?.error?.status;
            if (st === 401 || st === 403) setStatusMsg(BADTOK);
          });

          map.once('load', () => {
            if (!isMounted) return;
            if (pos) setMe(pos.lat, pos.lng);
            startWatch();
            findStations();
          });

          mapRef.current = map;
        } else if (mapRef.current) {
          mapRef.current.resize();
          findStations();
        }
      } catch (e) {
        setStatusMsg('Không tải được bản đồ. Kiểm tra mạng và token Mapbox.');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, token, mode]);

  const handleSaveToken = () => {
    const k = tokenInput.trim();
    if (k.startsWith('sk.')) {
      setStatusMsg('Đây là token bí mật (sk.). Không dùng ở đây. Hãy dùng token công khai bắt đầu bằng pk.');
      return;
    }
    if (!k.startsWith('pk.') || k.length < 30) {
      setStatusMsg('Token chưa đúng. Token công khai bắt đầu bằng pk.');
      return;
    }
    setToken(k);
    setShowTokenBox(false);
    try {
      localStorage.setItem('soxe_mbtoken', k);
    } catch {}
  };

  const handleLocateMe = async () => {
    if (!mapRef.current) return;
    let p = myPosRef.current;
    if (!p) {
      p = await getPos();
      if (p) setMe(p.lat, p.lng);
    }
    if (!p) {
      setStatusMsg('Không lấy được vị trí. Hãy cho phép truy cập vị trí cho trang này.');
      return;
    }
    mapRef.current.once('moveend', findStations);
    mapRef.current.flyTo({ center: [p.lng, p.lat], zoom: 15 });
  };

  if (!isOpen) return null;

  return (
    <div id="mapbox" className="card" style={{ margin: '12px 0 0' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
        <h2 id="mtitle" style={{ margin: 0 }}>
          {mode === 'dealer' ? '🏬 Showroom / xưởng dịch vụ' : '🗺️ Chọn cây xăng'}
        </h2>
        <button
          type="button"
          id="mclose"
          onClick={() => {
            stopWatch();
            onClose();
          }}
        >
          ✖ Đóng
        </button>
      </div>

      {showTokenBox && (
        <div id="mkeybox" className="row" style={{ margin: '6px 0' }}>
          <input
            id="mkey"
            placeholder="Dán Mapbox token công khai (pk.…)"
            style={{ flex: 1 }}
            aria-label="Mapbox token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <button type="button" id="mkeysave" className="pri" onClick={handleSaveToken}>
            Lưu
          </button>
        </div>
      )}

      {mode === 'dealer' && (
        <div id="mbrandbox" className="row" style={{ margin: '6px 0' }}>
          <input
            id="mbrand"
            list="vbrands"
            placeholder="Hãng xe (Honda, Yamaha, Toyota…)"
            style={{ flex: 1 }}
            aria-label="Hãng xe"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                findStations();
              }
            }}
          />
          <button type="button" id="mbrandgo" className="pri" onClick={findStations}>
            🔍 Tìm showroom
          </button>
        </div>
      )}

      {statusMsg && (
        <p id="mmsg" className="empty" role="status" style={{ margin: '4px 0 6px' }}>
          {statusMsg}
        </p>
      )}

      <div id="mapwrap">
        <div className="row" style={{ marginBottom: '6px' }}>
          <button type="button" id="mfind" onClick={findStations}>
            {mode === 'dealer' ? '🔍 Tìm showroom khu vực này' : '🔍 Tìm cây xăng ở khu vực này'}
          </button>
          <button type="button" id="mloc" onClick={handleLocateMe}>
            📍 Vị trí của tôi
          </button>
        </div>
        <div
          ref={mapContainerRef}
          id="map"
          style={{ height: '300px', borderRadius: '10px', background: 'var(--inp)' }}
        />
        <div id="mlist" style={{ maxHeight: '220px', overflow: 'auto', marginTop: '6px' }}>
          {placeList.map((pl, i) => (
            <button
              key={pl.pid || i}
              type="button"
              className="lnk"
              data-mp={i}
              style={{ display: 'block', textAlign: 'left', width: '100%' }}
              onClick={() => {
                stopWatch();
                onSelectPlace(pl);
              }}
            >
              <b>
                {mode === 'dealer' ? '🏬' : '⛽'} {pl.name}
              </b>
              <br />
              <small>{pl.addr}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
