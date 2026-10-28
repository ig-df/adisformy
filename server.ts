import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '20mb' }));

// Server-side Gemini Vision API proxy for rapid and secure image recognition
app.post('/api/gemini/scan', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ success: false, error: 'GEMINI_API_KEY is not configured on server' });
    }

    const { imageBase64, mode } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Missing imageBase64' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptText = (mode === 'plan')
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
3. Even if X happens to be a valid mold number in the database, when written as the FIRST number before the dash in "X - Y", X is STRICTLY the MACHINE NUMBER for Mold Y.
4. Extract each line into a pair object: {"machine": "X", "mold": "Y"}.
5. Put all extracted MOLD numbers Y into the 'numbers' array.

Return strictly valid JSON only without markdown formatting with this schema:
{"pairs":[{"machine":"11","mold":"867"},{"machine":"6","mold":"808"},{"machine":"29","mold":"649"}],"numbers":["867","808","649"],"raw_text":"11-867\n6-808\n29-649"}`
      : `You are an expert industrial OCR and vision system for injection mold factory warehouse tracking.
Look at this photo of an injection mold tag, physical metal mold plate, paper sticker, product sample, or handwritten note.
Carefully identify:
1. PRIMARY injection mold number (číslo formy), typically 2 to 6 digits (e.g. 765, 976, 808, 0584, 000584, 050, 50, 10425).
2. Product or part name (název výrobku/dílu, e.g. "Steckdeckel", "Kryt", "Adapter", "Lišta", "Držák", "Panel", "VW", etc.).
3. Customer name (zákazník) or any visible text.

Return strictly valid JSON only without markdown formatting with this schema:
{"primary_number":"050","numbers":["050"],"product_name":"Steckdeckel","raw_text":"050 C Steckdeckel"}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: promptText },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const cleanJson = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let data;
    try {
      data = JSON.parse(cleanJson);
    } catch {
      data = { raw_text: text };
    }

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Server scan error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Gemini processing failed' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist', {
      maxAge: '1d',
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
