import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
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
      const { imageBase64, mode = "tag", mimeType = "image/jpeg" } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(200).json({
          success: false,
          fallback: true,
          message: "API-ключ Gemini не настроен на сервере.",
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

      const promptText = (mode === "plan")
        ? `You are an expert industrial vision and OCR system for an injection mold factory warehouse.
Look at this photo containing a handwritten shift plan sheet, paper schedule, or production table created by workshop mechanics/planners.

STANDARD HANDWRITTEN LAYOUT PATTERN:
Mechanics typically write items in lines formatted as: [Machine Number] [Separator] [Mold Number]
Separators can be any horizontal stroke, dash, hyphen (-, –, —), underscore (_), slash (/), colon (:), tilde (~), or spaces with indentation.
Examples:
  "11 - 867"  -> Machine 11, Mold 867
  "6 - 808"   -> Machine 6, Mold 808
  "29 - 649"  -> Machine 29, Mold 649
  "3 - 748"   -> Machine 3, Mold 748
  "20 - 971"  -> Machine 20, Mold 971
  "2 - 412"   -> Machine 2, Mold 412

CRITICAL DISAMBIGUATION RULES FOR MACHINES VS MOLDS:
1. WORKSHOP MACHINE NUMBERS:
   The workshop has specific machines: 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 18, 19, 20, 23, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38.
2. In lines written as "X - Y", "X – Y", "X — Y", "X : Y", "X / Y", or "X Y" (where X is a machine number and Y is a mold number):
   - X is STRICTLY the MACHINE NUMBER (e.g. in "29 - 649", "29" before the dash is Machine 29, NOT Mold 29!).
   - Y is STRICTLY the MOLD NUMBER (e.g. "649" after the dash is Mold 649).
3. Even if X happens to be a valid mold number in the database (like 19, 20, 23, 26, 28, 29, 30, 33, 34, 35, 36, 38), when written as the FIRST number before the dash in "X - Y", X is STRICTLY the MACHINE NUMBER for Mold Y.
4. Extract each line into a pair object: {"machine": "X", "mold": "Y"}.
5. Put all extracted MOLD numbers Y into the 'numbers' array.

CRITICAL INDUSTRIAL CONTEXT & HANDWRITTEN DISAMBIGUATION:
- ROBUST TO ANY HANDWRITING SIZE & STYLE: Numbers may be written with thick marker or fine pen/pencil.
- STRICT EUROPEAN HANDWRITTEN '7' VS '1' DISAMBIGUATION:
  * Digit '7' in Czech/European handwriting ALWAYS has a horizontal crossbar through the stem (7̵).
  * Digit '1' has a top hook without a middle bar.
  * Extract ONLY the exact numbers physically written on the paper without hallucinating or substituting digits.
- Hand-drawn zeros '0' and letter 'O': always treat as digit '0'.
- Hand-drawn '5' vs 'S': always treat as digit '5'.

Return strictly valid JSON only without markdown formatting with this schema:
{"pairs":[{"machine":"11","mold":"867"},{"machine":"6","mold":"808"},{"machine":"29","mold":"649"},{"machine":"3","mold":"748"},{"machine":"20","mold":"971"},{"machine":"2","mold":"412"}],"numbers":["867","808","649","748","971","412"],"raw_text":"11-867\n6-808\n29-649\n3-748\n20-971\n2-412"}`
        : `You are an expert industrial OCR and vision system for injection mold factory warehouse tracking.
Look at this photo of an injection mold tag, physical metal mold plate, paper sticker, product sample, or handwritten note.
Carefully identify:
1. PRIMARY injection mold number (číslo formy), typically 2 to 6 digits (e.g. 765, 976, 808, 0584, 000584, 050, 50, 10425).
2. Product or part name (název výrobku/dílu, e.g. "Steckdeckel", "Kryt", "Adapter", "Lišta", "Držák", "Panel", "VW", etc.).
3. Customer name (zákazník) or any visible text.

CRITICAL INDUSTRIAL CONTEXT & HANDWRITTEN DISAMBIGUATION:
- ROBUST TO ANY HANDWRITING SIZE & STYLE: Numbers may be written exceptionally large filling the frame with a wide marker, or written very small in pencil or fine pen in a corner or table box. Read digits reliably at any physical size, stroke width, cursive or print style, and orientation.
- ALL WRITING INSTRUMENTS: Supports pencil, blue/black ballpoint pen, fountain ink, felt-tip marker, chalk, or grease pencil.
- SEPARATE TEXT & ZONE LETTERS FROM NUMBER: If letters, words, or zone markers appear adjacent to the number (e.g. "050 C", "50 C", "765 Z", "0584 H", "forma 0584", "kryt 765"), strictly extract the pure numeric digits into 'primary_number' (e.g. "050") and 'numbers', and keep all letters/words in 'product_name' and 'raw_text'. Never merge letters or zone letters into primary_number.
- LEADING ZEROS: Mold numbers are frequently written with leading zeros (such as "000584", "00584", "0584", "050", "00765", "000976"). Preserve the exact digits in primary_number.
- Industrial context: Injection mold parts (kryt, lišta, držák, výztuha, těsnění, panel, rám, záslepka, víčko, Steckdeckel, Gehäuse, Halter, Blende) and automotive brands (Škoda, VW, Audi, Hella, Bosch).
- STRICT EUROPEAN HANDWRITTEN '7' VS '1' DISAMBIGUATION:
  * In Czech / European handwriting, digit '7' ALWAYS has a horizontal crossbar through the stem (7̵). This is strictly digit '7' (SEVEN). DO NOT misread it as 1, 4, 9, or 3!
  * Digit '1' has a top diagonal hook without a middle bar.
  * DO NOT guess or add alternative number substitutions. Extract only what is written.
- European handwritten '4' has a closed or open top.
- Hand-drawn zeros '0' and letter 'O'/'D': in mold numbers they are always numeric digit '0'.
- Hand-drawn digit '5' vs letter 'S': in numeric codes always treat as digit '5'.
- IGNORE faint ghost text or translucent numbers bleeding through from the reverse side of paper! Extract ONLY prominent foreground written numbers.
- Include all read text in raw_text.

Return strictly valid JSON only without markdown formatting with this schema:
{"primary_number":"050","numbers":["050"],"product_name":"Steckdeckel","raw_text":"050 C Steckdeckel"}`;

      const candidateModels = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
      let response = null;
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
            config: {
              responseMimeType: "application/json",
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW,
              },
            },
          });
          if (response && response.text) {
            break;
          }
        } catch (mErr: any) {
          lastError = mErr;
          console.warn(`[Gemini OCR] Model ${modelName} failed, trying next candidate:`, mErr.message);
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error("Не удалось получить ответ от моделей Gemini Vision");
      }

      const rawJson = (response.text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsedData = JSON.parse(rawJson || "{}");

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error("Gemini Scan Error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Ошибка при распознавании через Gemini Vision AI",
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
