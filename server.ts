import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API 1: Smart Clustering
  app.post("/api/ai/cluster", async (req, res) => {
    try {
      const { stops, numClusters } = req.body;
      const prompt = `You are an expert route planner in Yangon, Myanmar. 
I have a list of ${stops.length} bus stops/locations. I need you to cluster them into exactly ${numClusters} groups based on geographic proximity and Yangon's road networks (e.g., Pyay Road corridor, Insein Road, Kabar Aye Pagoda Road, etc.).
Return a JSON array of groups, where each group has a 'clusterName' (e.g., "North Okkalapa Zone") and an array of 'stopIds' belonging to that group.

Stops:
${JSON.stringify(stops.map((s: any) => ({ id: s.id, name: s.name, township: s.township })), null, 2)}
`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                clusterName: { type: Type.STRING },
                stopIds: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["clusterName", "stopIds"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text() || "[]"));
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // API 2: Route Insights
  app.post("/api/ai/insights", async (req, res) => {
    try {
      const { route } = req.body;
      const prompt = `You are a smart Yangon Traffic & Routing AI.
Analyze this route which contains the following stops in order:
${route.stops.map((s:any, i:number) => `${i+1}. ${s.name} (${s.township})`).join('\n')}

Provide human-readable insights (in Myanmar language or bilingual). Mention potential traffic bottlenecks (like Hledan, Myaynigone, 8 Mile), estimated real-world conditions, and a recommendation (e.g., "Leave 15 mins early"). 
Format as a brief, engaging paragraph or bullet points. Keep it under 100 words.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });
      res.json({ text: response.text() });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // API 3: Anomaly Detection
  app.post("/api/ai/anomaly", async (req, res) => {
    try {
      const { route } = req.body;
      const prompt = `Analyze this route for geographic anomalies in Yangon.
A geographic anomaly is a stop that is very far from the others or out of logical sequence, requiring a massive detour (e.g., a Thingangyun stop mixed into an Insein route).
Stops in order:
${route.stops.map((s:any, i:number) => `ID:${s.id} | ${s.name} (${s.township})`).join('\n')}

Identify if there are any anomalous stops. Return JSON format.
If yes, set 'hasAnomaly' to true, provide a 'reason' (Myanmar language), and list the 'anomalousStopIds'. If no, set 'hasAnomaly' to false.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hasAnomaly: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
              anomalousStopIds: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["hasAnomaly", "reason", "anomalousStopIds"]
          }
        }
      });
      res.json(JSON.parse(response.text() || "{}"));
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // API 4: Address Cleaner
  app.post("/api/ai/clean-address", async (req, res) => {
    try {
      const { records } = req.body; // array of { id, address_text }
      const prompt = `You are a Yangon Address Data Cleanser.
I have a list of raw address texts entered by users. They may have typos, mixed English/Myanmar, or messy formats.
Clean them up, identify the correct 'Township' (in English), and extract the core 'road' or 'ward' if possible.
Input:
${JSON.stringify(records, null, 2)}

Return a JSON array of the same length, with elements containing:
id: original id
cleanedAddress: nicely formatted address in Myanmar or English
township: standard English township name (e.g., "Hlaing", "Kamaryut", "Thingangyun")
`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                cleanedAddress: { type: Type.STRING },
                township: { type: Type.STRING }
              },
              required: ["id", "cleanedAddress", "township"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text() || "[]"));
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
