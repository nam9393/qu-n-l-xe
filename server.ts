import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Parse voice or text command into structured Vehicle Log Entry
app.post('/api/gemini/parse-command', async (req, res) => {
  try {
    const { text, currentOdo, vehicleName } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text prompt is required' });
      return;
    }

    const prompt = `Phân tích câu lệnh hoặc giọng nói sau từ người dùng để điền tự động vào sổ theo dõi xe:
"${text}"
Thông tin xe hiện tại: Tên xe "${vehicleName || 'Phương tiện'}", Số Odometer hiện tại: ${currentOdo || 0} km.

Hãy xác định các trường:
- type: 'fuel' (đổ xăng/nhiên liệu), 'service' (bảo dưỡng/sửa chữa/thay nhớt/phụ tùng), 'other' (chi phí khác như gửi xe, cầu đường, rửa xe), 'income' (thu nhập, chạy xe, chở khách)
- amount: số tiền (VNĐ, số nguyên dương). Chú ý chuyển đổi các đơn vị như 'k', 'nghìn', 'ngàn', 'tr', 'triệu' thành số (ví dụ: 500k -> 500000, 1tr2 -> 1200000).
- odo: số km trên đồng hồ nếu người dùng nhắc đến (ví dụ: 'tại km 12000', 'mốc 15k km'). Nếu không nhắc đến có thể để null hoặc bằng mốc hiện tại.
- note: mô tả ngắn gọn (ví dụ: "Thay nhớt máy", "Rửa xe bọt tuyết", "Chạy xe công nghệ").
- price: đơn giá 1 lít xăng nếu có nhắc đến (ví dụ: "giá 23k/lít").
- liters: số lít xăng nếu có nhắc đến.
- full: boolean, true nếu người dùng nói "đầy bình", "tràn bình", "full bình". Mặc định true cho đổ xăng nếu không nói rõ.
- ft: loại xăng nếu có nhắc đến ('e10', 'e5', 'ron95', hoặc 'other').
- partName: tên phụ tùng nếu thuộc bảo dưỡng (ví dụ: 'Nhớt máy', 'Bugi', 'Lọc gió', 'Má phanh', 'Lốp').
- explanation: câu phản hồi xác nhận ngắn gọn thân thiện, phong cách phi thuyền/AI Copilot không gian (tối đa 25 từ).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Bạn là Astro Copilot - Trợ lý buồng lái không gian thông minh của Veo App. Bạn chuyên phân tích các câu lệnh giọng nói và văn bản tiếng Việt để tự động điền form đổ xăng, bảo dưỡng và chi phí xe.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description: 'fuel, service, other, or income',
            },
            amount: {
              type: Type.INTEGER,
              description: 'Total amount in VNĐ',
            },
            odo: {
              type: Type.INTEGER,
              description: 'Odometer km if mentioned',
            },
            note: {
              type: Type.STRING,
              description: 'Brief description of the action',
            },
            price: {
              type: Type.INTEGER,
              description: 'Price per liter for fuel if mentioned',
            },
            liters: {
              type: Type.NUMBER,
              description: 'Number of liters for fuel if mentioned',
            },
            full: {
              type: Type.BOOLEAN,
              description: 'Whether it is a full tank fill-up',
            },
            ft: {
              type: Type.STRING,
              description: 'e10, e5, ron95, or other',
            },
            partName: {
              type: Type.STRING,
              description: 'Part name for maintenance',
            },
            explanation: {
              type: Type.STRING,
              description: 'Astro Copilot brief confirmation message',
            },
          },
          required: ['type', 'amount', 'explanation'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Gemini parse error:', error);
    res.status(500).json({ error: error?.message || 'Gemini processing failed' });
  }
});

// Endpoint: AI Vehicle Copilot Chat & Advice
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const contextStr = context ? JSON.stringify(context) : 'Chưa có thông tin xe.';
    const prompt = `Bạn là Astro Copilot - Trợ lý AI phi thuyền không gian thông minh của Veo App.
Hãy trò chuyện, tư vấn kỹ thuật, chăm sóc xe, tiết kiệm nhiên liệu, nhắc bảo dưỡng hoặc giải đáp thắc mắc của người lái.
Giọng điệu: Hiện đại, chuyên nghiệp, phong cách không gian/viễn tưởng nhẹ nhàng, thân thiện, tiếng Việt tự nhiên và súc tích.

Dữ liệu phương tiện và thông số hiện tại:
${contextStr}

Yêu cầu người dùng:
"${message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ success: true, reply: response.text || 'Không có phản hồi từ Astro Copilot.' });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({ error: error?.message || 'Astro Copilot failed' });
  }
});

// Setup Vite middleware for development or serve dist for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Space Cockpit Veo App running on http://${HOST}:${PORT}`);
  });
}

startServer();
