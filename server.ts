import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Adis Formy", mode: "production_ready" });
  });

  // Gemini Tag Scanner API Endpoint
  app.post("/api/gemini/scan", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg" } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(200).json({
          success: false,
          fallback: true,
          message: "API-ключ Gemini не настроен. Переключено на локальный OCR алгоритм.",
          data: null
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: `Проанализируй изображение цеховой бирки или бланка прессующей формы завода (Adis Formy).
Извлеки следующие параметры и верни строго JSON:
- code: артикул или шифр пресс-формы (например PF-2024-88A)
- name: наименование детали/формы (например Пресс-форма поддона АКП-400)
- pressType: тип пресса (например ПА-400, ГП-250, ТП-1000)
- dimensions: габариты в мм (например 850x600x420 мм)
- weightKg: вес в кг (число)
- serialNumber: заводской серийный номер
- confidence: уверенность распознавания в процентах (0-100)
- rawNotes: заметки или штампы ОТК с бирки`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              name: { type: Type.STRING },
              pressType: { type: Type.STRING },
              dimensions: { type: Type.STRING },
              weightKg: { type: Type.NUMBER },
              serialNumber: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              rawNotes: { type: Type.STRING },
            },
            required: ["code", "name", "pressType"],
          },
        },
      });

      const parsedData = JSON.parse(response.text || "{}");

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error("Gemini Scan Error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Ошибка при распознавании бирки через Gemini Vision AI",
      });
    }
  });

  // Vite middleware for dev or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Adis Formy Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
