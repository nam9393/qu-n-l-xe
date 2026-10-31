import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone app, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="pri"
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)',
          color: '#fff',
          fontWeight: 700,
          border: '1px solid #00f0ff',
          boxShadow: '0 0 12px rgba(0, 240, 255, 0.4)',
        }}
      >
        📲 Cài đặt App
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          style={{
            padding: '6px 10px',
            fontSize: '12px',
            borderRadius: '8px',
            background: 'rgba(0, 240, 255, 0.15)',
            borderColor: 'rgba(0, 240, 255, 0.4)',
            color: '#00f0ff',
          }}
        >
          📲 Cài trên iPhone
        </button>

        {showIOSGuide && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(10px)',
              padding: '16px',
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: '380px',
                width: '100%',
                background: '#09152e',
                border: '1px solid #00f0ff',
                boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: '#00f0ff', fontSize: '16px' }}>
                📲 Cài đặt Veo App trên iPhone / iPad
              </h3>
              <p style={{ fontSize: '13px', color: '#cce6ff', lineHeight: 1.6, margin: '0 0 14px' }}>
                1. Mở trang này bằng trình duyệt <b>Safari</b>.<br />
                2. Chạm vào biểu tượng <b>Chia sẻ (Share <span style={{ fontSize: '16px' }}>⎙</span>)</b> ở thanh công cụ dưới màn hình.<br />
                3. Cuộn xuống và chọn <b>"Thêm vào Màn hình chính" (Add to Home Screen)</b>.<br />
                4. Biểu tượng Veo App sẽ xuất hiện trên màn hình điện thoại như ứng dụng tải từ App Store!
              </p>
              <button
                type="button"
                className="pri"
                style={{ width: '100%' }}
                onClick={() => setShowIOSGuide(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback button showing universal guide
  return (
    <>
      <button
        type="button"
        onClick={() => setShowIOSGuide(true)}
        style={{
          padding: '6px 10px',
          fontSize: '12px',
          borderRadius: '8px',
          background: 'rgba(0, 240, 255, 0.12)',
          borderColor: 'rgba(0, 240, 255, 0.3)',
          color: '#a5f3fc',
        }}
        title="Cài đặt app lên điện thoại hoặc máy tính"
      >
        📲 Cài đặt App
      </button>

      {showIOSGuide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '420px',
              width: '100%',
              background: '#09152e',
              border: '1px solid #00f0ff',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', color: '#00f0ff', fontSize: '16px' }}>
              📲 Cách cài đặt Veo App thành ứng dụng
            </h3>
            <div style={{ fontSize: '13px', color: '#cce6ff', lineHeight: 1.6, margin: '0 0 14px' }}>
              <p style={{ margin: '0 0 8px' }}>
                <b>📱 Trên Android / Chrome máy tính:</b> Bấm menu ba chấm ⋮ góc trên bên phải → chọn <b>"Cài đặt ứng dụng"</b> hoặc <b>"Thêm vào màn hình chính"</b>.
              </p>
              <p style={{ margin: '0 0 8px' }}>
                <b>🍎 Trên iPhone / iPad (Safari):</b> Bấm nút <b>Chia sẻ (Share)</b> → chọn <b>"Thêm vào Màn hình chính"</b>.
              </p>
              <p style={{ margin: 0, color: 'var(--mut)', fontSize: '12px' }}>
                App sẽ hoạt động toàn màn hình, mượt mà và lưu dữ liệu offline như ứng dụng gốc!
              </p>
            </div>
            <button
              type="button"
              className="pri"
              style={{ width: '100%' }}
              onClick={() => setShowIOSGuide(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};
