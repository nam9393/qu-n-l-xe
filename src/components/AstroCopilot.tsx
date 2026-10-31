import React, { useState, useEffect, useRef } from 'react';
import { ParsedCommand, parseVoiceKeywordCommand, parseWithGeminiAI } from '../utils/voiceParser';
import { playChimeSound, playConfirmSound } from '../utils/sound';
import { Vehicle } from '../types';

interface AstroCopilotProps {
  currentVehicle: Vehicle | null;
  currentOdo: number;
  soundEnabled: boolean;
  onApplyCommand: (cmd: ParsedCommand) => void;
}

export const AstroCopilot: React.FC<AstroCopilotProps> = ({
  currentVehicle,
  currentOdo,
  soundEnabled,
  onApplyCommand,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [commandInput, setCommandInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'copilot'; text: string }>>([
    {
      sender: 'copilot',
      text: 'Xin chào Chỉ huy! Tôi là Astro Copilot Gemini. Hãy ra lệnh bằng giọng nói hoặc gõ từ khóa (ví dụ: "lệnh: đổ xăng, giá tiền: 500k" hoặc "bảo dưỡng: thay nhớt 250k mốc 15000 km").',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'vi-VN';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Đang lắng nghe chỉ thị...');
        playChimeSound(soundEnabled);
      };

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(text);
        setCommandInput(text);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setStatusMessage('Không thu được âm thanh. Nhấn mic để thử lại.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [soundEnabled]);

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      setStatusMessage('Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể gõ trực tiếp câu lệnh.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setStatusMessage('Đang kích hoạt radar giọng nói...');
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
      }
    }
  };

  const processTextCommand = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    setIsProcessing(true);
    setStatusMessage('Astro Copilot đang giải mã dữ liệu...');

    // 1. Fast offline keyword check first
    const fastParsed = parseVoiceKeywordCommand(text, currentOdo);
    if (fastParsed && fastParsed.amount > 0) {
      playConfirmSound(soundEnabled);
      setIsProcessing(false);
      setStatusMessage(`✨ ${fastParsed.explanation}`);
      onApplyCommand(fastParsed);
      setCommandInput('');
      setTranscript('');
      return;
    }

    // 2. Deep Gemini AI parsing
    try {
      const geminiParsed = await parseWithGeminiAI(
        text,
        currentOdo,
        currentVehicle?.name || 'Phương tiện'
      );
      if (geminiParsed && (geminiParsed.amount > 0 || geminiParsed.note)) {
        playConfirmSound(soundEnabled);
        setStatusMessage(`🤖 Gemini: ${geminiParsed.explanation || 'Đã áp dụng thông số vào buồng lái!'}`);
        onApplyCommand(geminiParsed);
        setCommandInput('');
        setTranscript('');
      } else {
        setStatusMessage(
          'Chưa rõ thông số chi phí. Hãy thử mẫu: "lệnh: đổ xăng, giá tiền: 500k" hoặc "thay nhớt 250k".'
        );
      }
    } catch {
      setStatusMessage('Kết nối Gemini AI gián đoạn. Đã chuyển sang chế độ thủ công.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setAiMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: {
            vehicleName: currentVehicle?.name,
            plate: currentVehicle?.plate,
            currentOdo,
            tank: currentVehicle?.tank,
            cons: currentVehicle?.cons,
          },
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setAiMessages((prev) => [...prev, { sender: 'copilot', text: data.reply }]);
      } else {
        setAiMessages((prev) => [
          ...prev,
          { sender: 'copilot', text: 'Chưa có dữ liệu từ trạm radar Gemini.' },
        ]);
      }
    } catch {
      setAiMessages((prev) => [
        ...prev,
        { sender: 'copilot', text: 'Mất tín hiệu vệ tinh tới Gemini AI.' },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(145deg, rgba(8, 20, 48, 0.92), rgba(112, 0, 255, 0.12))',
        borderColor: isListening ? '#00f0ff' : 'rgba(0, 240, 255, 0.35)',
        boxShadow: isListening
          ? '0 0 25px rgba(0, 240, 255, 0.4), inset 0 0 15px rgba(0, 240, 255, 0.1)'
          : undefined,
        marginBottom: '14px',
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🛸</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '14.5px', color: '#00f0ff' }}>
              Astro Copilot · AI & Radar Giọng Nói
            </h2>
            <small style={{ color: 'var(--mut)', fontSize: '11px' }}>
              Gemini 3.8 Flash · Tự động điền theo lệnh thoại & từ khóa
            </small>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAiChatOpen((prev) => !prev)}
          style={{
            fontSize: '12px',
            padding: '5px 10px',
            background: 'rgba(0, 240, 255, 0.12)',
            borderColor: 'rgba(0, 240, 255, 0.3)',
          }}
        >
          💬 Hỏi đáp AI
        </button>
      </div>

      {/* Voice Control Bar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleToggleMic}
          title={isListening ? 'Dừng thu âm' : 'Bật micro ra lệnh giọng nói'}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            padding: 0,
            flexShrink: 0,
            background: isListening
              ? 'radial-gradient(circle, #ff0055 30%, #7000ff 100%)'
              : 'radial-gradient(circle, #00f0ff 20%, #0066ff 100%)',
            borderColor: isListening ? '#ff3366' : '#00f0ff',
            boxShadow: isListening
              ? '0 0 20px #ff0055'
              : '0 0 16px rgba(0, 240, 255, 0.6)',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          {isListening ? '⏹️' : '🎙️'}
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder='Ra lệnh: "lệnh: đổ xăng, giá tiền: 500k" hoặc "thay nhớt 250k"'
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                processTextCommand(commandInput);
              }
            }}
            style={{
              width: '100%',
              paddingRight: '65px',
              borderColor: isListening ? '#00f0ff' : undefined,
            }}
          />
          <button
            type="button"
            className="pri"
            disabled={!commandInput.trim() || isProcessing}
            onClick={() => processTextCommand(commandInput)}
            style={{
              position: 'absolute',
              right: '4px',
              top: '4px',
              bottom: '4px',
              padding: '0 12px',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          >
            {isProcessing ? '⏳' : 'Nạp'}
          </button>
        </div>
      </div>

      {/* Live Voice Waves & Status */}
      {isListening && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <div className="voice-wave">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <span style={{ fontSize: '12.5px', color: '#00f0ff', fontStyle: 'italic' }}>
            {transcript || 'Nói: "lệnh: đổ xăng, giá tiền 500k" hoặc "bảo dưỡng bugi 80k"...'}
          </span>
        </div>
      )}

      {statusMessage && !isListening && (
        <div
          style={{
            fontSize: '12px',
            color: '#a5f3fc',
            marginTop: '8px',
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'rgba(0, 240, 255, 0.08)',
            borderLeft: '3px solid #00f0ff',
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Suggested Quick Commands */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
        <small style={{ color: 'var(--mut)', alignSelf: 'center', fontSize: '11px', marginRight: '4px' }}>
          Lệnh mẫu:
        </small>
        {[
          'lệnh: đổ xăng, giá tiền: 500k',
          'bảo dưỡng thay nhớt 250k',
          'lệnh: đổ xăng 300k ron95',
          'bảo dưỡng bugi và lọc gió 200k',
          'thu nhập grab 450k',
        ].map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => {
              setCommandInput(cmd);
              processTextCommand(cmd);
            }}
            style={{
              padding: '3px 8px',
              fontSize: '11.5px',
              borderRadius: '6px',
              background: 'rgba(6, 16, 36, 0.7)',
              borderColor: 'rgba(0, 240, 255, 0.2)',
              color: '#cce6ff',
            }}
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* AI Chat Modal Dialog */}
      {aiChatOpen && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(0, 240, 255, 0.2)',
          }}
        >
          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '10px',
              paddingRight: '4px',
            }}
          >
            {aiMessages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '7px 11px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  background:
                    m.sender === 'user'
                      ? 'linear-gradient(135deg, #00f0ff 0%, #0088ff 100%)'
                      : 'rgba(10, 25, 55, 0.9)',
                  color: m.sender === 'user' ? '#03121f' : '#e2f1ff',
                  border: m.sender === 'copilot' ? '1px solid rgba(0, 240, 255, 0.25)' : 'none',
                }}
              >
                <b>{m.sender === 'user' ? 'Bạn' : 'Astro Copilot'}:</b> {m.text}
              </div>
            ))}
            {isChatLoading && (
              <div style={{ color: '#00f0ff', fontSize: '12px', fontStyle: 'italic' }}>
                Astro Copilot đang kết nối vệ tinh phân tích...
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Hỏi về mức tiêu hao, nhớt máy, kinh nghiệm lái..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ flex: 1, padding: '7px 10px', fontSize: '12.5px' }}
            />
            <button type="submit" className="pri" disabled={isChatLoading || !chatInput.trim()}>
              Gửi
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
