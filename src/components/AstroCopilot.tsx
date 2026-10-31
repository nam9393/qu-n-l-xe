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
  const silenceTimerRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');

  // Local Copilot Knowledge Fallback for Client
  const getClientFallbackAdvice = (msg: string): string => {
    const lower = msg.toLowerCase();
    const vName = currentVehicle?.name || 'phương tiện';
    const odo = currentOdo || 0;

    if (lower.includes('nhớt') || lower.includes('dầu')) {
      return `🛢️ [Tư vấn nhớt ${vName}]:
- Xe máy: Thay sau mỗi 1.500 - 2.000 km (nhớt khoáng) hoặc 3.000 - 4.000 km (nhớt 100% tổng hợp).
- Ô tô: Thay sau mỗi 5.000 - 10.000 km. Luôn thay lọc nhớt sau mỗi 2 lần thay nhớt máy.
- Mốc km hiện tại của bạn: ${odo.toLocaleString('vi-VN')} km.`;
    }
    if (lower.includes('xăng') || lower.includes('tiết kiệm') || lower.includes('tiêu hao')) {
      return `⛽ [Mức tiêu hao & Tiết kiệm nhiên liệu]:
- Duy trì tay ga/chân ga đều đặn, tránh tăng tốc đột ngột.
- Kiểm tra áp suất lốp đủ chuẩn (lốp non làm tốn thêm 5-10% xăng).
- Vệ sinh lọc gió định kỳ mỗi 5.000 km.`;
    }
    if (lower.includes('lốp') || lower.includes('áp suất')) {
      return `🛞 [Tư vấn áp suất lốp]:
- Xe máy: Bánh trước ~2.0 kg/cm² (29 PSI), bánh sau ~2.3 kg/cm² (33 PSI).
- Ô tô: Thường 2.2 - 2.5 bar (32 - 36 PSI). Nên đảo lốp mỗi 10.000 km.`;
    }
    return `🛸 [Astro Copilot - Trợ lý xe ${vName}]:
Tôi đã ghi nhận câu hỏi của bạn. Xe đang ở mốc Odo: ${odo.toLocaleString('vi-VN')} km.
Bạn có thể hỏi tôi về định kỳ thay nhớt, kiểm tra lọc gió/bugi, kinh nghiệm chạy tiết kiệm xăng hoặc ra lệnh giọng nói: "lệnh: đổ xăng, giá tiền: 500k".`;
  };

  const processTextCommand = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    setIsProcessing(true);
    setStatusMessage('⚡ Astro Copilot đang giải mã dữ liệu câu lệnh...');

    // 1. Fast offline keyword check first
    const fastParsed = parseVoiceKeywordCommand(text, currentOdo);
    if (fastParsed && fastParsed.amount > 0) {
      playConfirmSound(soundEnabled);
      setIsProcessing(false);
      setStatusMessage(`✨ Đã tự động điền: ${fastParsed.explanation}`);
      onApplyCommand(fastParsed);
      setCommandInput('');
      setTranscript('');
      latestTranscriptRef.current = '';
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
        setStatusMessage(`🤖 Đã tự động nạp: ${geminiParsed.explanation || 'Đã áp dụng vào form!'}`);
        onApplyCommand(geminiParsed);
        setCommandInput('');
        setTranscript('');
        latestTranscriptRef.current = '';
      } else {
        setStatusMessage(
          'Chưa rõ số tiền. Hãy nói rõ: "lệnh: đổ xăng, giá tiền: 500k" hoặc "thay nhớt 250k".'
        );
      }
    } catch {
      if (fastParsed) {
        playConfirmSound(soundEnabled);
        setStatusMessage(`✨ Tự động nhận diện: ${fastParsed.explanation}`);
        onApplyCommand(fastParsed);
      } else {
        setStatusMessage('Đã nhận lệnh thoại, bạn có thể kiểm tra và lưu vào sổ chi tiêu.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      // Continuous = true so it does NOT cut off abruptly while user is speaking
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'vi-VN';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('🎙️ Đang lắng nghe... Nói tự nhiên, hệ thống sẽ tự động điền khi bạn dứt câu!');
        playChimeSound(soundEnabled);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript + ' ';
          } else {
            interimText += res[0].transcript;
          }
        }

        const combinedText = (finalText + interimText).trim();
        setTranscript(combinedText);
        setCommandInput(combinedText);
        latestTranscriptRef.current = combinedText;

        // Reset silence debounce timer: wait 1.8 seconds after user stops speaking to auto-submit
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (latestTranscriptRef.current.trim()) {
            setStatusMessage('⚡ Đã nhận diện xong câu nói, đang tự động điền...');
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch {}
            }
            setIsListening(false);
            processTextCommand(latestTranscriptRef.current);
          }
        }, 1800);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning:', event?.error);
        if (event?.error !== 'no-speech') {
          setIsListening(false);
          setStatusMessage('Không thu được âm thanh rõ. Bạn có thể nhấn mic để nói lại.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [soundEnabled, currentOdo, currentVehicle?.name]);

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      setStatusMessage('Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể gõ trực tiếp câu lệnh.');
      return;
    }

    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      recognitionRef.current.stop();
      setIsListening(false);
      if (latestTranscriptRef.current.trim()) {
        processTextCommand(latestTranscriptRef.current);
      }
    } else {
      setTranscript('');
      latestTranscriptRef.current = '';
      setStatusMessage('Đang kích hoạt micro... Hãy đọc đủ thông tin (ví dụ: "lệnh: đổ xăng, giá tiền: 500k")');
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch {}
        }, 200);
      }
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
      if (data && data.reply) {
        setAiMessages((prev) => [...prev, { sender: 'copilot', text: data.reply }]);
      } else {
        const fallback = getClientFallbackAdvice(userText);
        setAiMessages((prev) => [...prev, { sender: 'copilot', text: fallback }]);
      }
    } catch {
      const fallback = getClientFallbackAdvice(userText);
      setAiMessages((prev) => [...prev, { sender: 'copilot', text: fallback }]);
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
              Tự động lắng nghe & Tự động điền form khi dứt câu (không cần bấm nạp)
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

      {/* Voice Control Bar (Automatic fill on sentence end, no manual Nap button needed) */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleToggleMic}
          title={isListening ? 'Bấm để dừng và điền ngay' : 'Bật micro ra lệnh giọng nói'}
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
              ? '0 0 22px #ff0055'
              : '0 0 16px rgba(0, 240, 255, 0.6)',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isListening ? '⏹️' : '🎙️'}
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder='Đọc hoặc gõ: "lệnh: đổ xăng, giá tiền: 500k" hoặc "thay nhớt 250k"'
            value={commandInput}
            onChange={(e) => {
              setCommandInput(e.target.value);
              latestTranscriptRef.current = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                processTextCommand(commandInput);
              }
            }}
            style={{
              width: '100%',
              borderColor: isListening ? '#00f0ff' : undefined,
              paddingRight: isProcessing ? '40px' : '10px',
            }}
          />
          {isProcessing && (
            <div
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '14px',
                color: '#00f0ff',
              }}
            >
              ⚡
            </div>
          )}
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
