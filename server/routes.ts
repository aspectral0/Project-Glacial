import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.glaciers.list.path, async (req, res) => {
    try {
      const existingGlaciers = await storage.getGlaciers();
      if (existingGlaciers.length > 0) {
        return res.json(existingGlaciers);
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are a scientific research assistant specializing in glaciology. Provide authentic, real-world telemetry for exactly 3 major glaciers currently existing on Earth. Do not use a pre-set list; instead, select any 3 significant glaciers from across the globe (e.g., in Antarctica, Greenland, the Himalayas, the Andes, the Alps, etc.). For each glacier, provide: name, iceThickness (meters), surfaceArea (sq km), stability (0-100), tempSensitivity (1-10), and a detailed 2-sentence description including its specific geographic coordinates and regional context. Also provide realistic historical drill data based on actual scientific records: historicalTemp (5 values in Celsius, negative), co2Levels (5 values in ppm from 280-420), and layerStrength (5 values from 1-10). Respond ONLY with a JSON object containing a 'glaciers' array with exactly 3 glaciers.` 
          },
          { role: "user", content: `Establish satellite uplink and fetch telemetry for 3 unique real-world glaciers. Reference current climate data. Seed: ${Date.now()}` }
        ],
        response_format: { type: "json_object" }
      });

      const rawContent = response.choices[0].message.content || "{}";
      const data = JSON.parse(rawContent);
      const glaciersList = data.glaciers || [];
      
      const createdGlaciers = [];
      for (const g of glaciersList) {
        const glacier = await storage.createGlacier({
          name: g.name || "Unknown Glacier",
          description: g.description || `A unique glacier discovered in a remote region.`,
          iceThickness: Math.round(Number(g.iceThickness)) || 500,
          surfaceArea: Math.round(Number(g.surfaceArea)) || 100,
          stability: Math.round(Number(g.stability)) || 80,
          tempSensitivity: Math.round(Number(g.tempSensitivity)) || 5,
          drillData: g.drillData || {
            historicalTemp: [-20, -18, -15, -12, -10],
            co2Levels: [280, 310, 340, 380, 410],
            layerStrength: [9, 8, 7, 6, 5]
          }
        });
        createdGlaciers.push(glacier);
      }

      if (createdGlaciers.length === 0) throw new Error("Empty AI response");
      res.json(createdGlaciers);
    } catch (err) {
      console.error("AI Glacier List Error:", err);
      const fallbackData = [
        {
          name: "Jakobshavn Isbræ",
          description: "Located in western Greenland, it is one of the fastest moving glaciers in the world. It drains 6.5% of the Greenland ice sheet and produces 10% of all Greenland icebergs.",
          iceThickness: 800,
          surfaceArea: 110000,
          stability: 35,
          tempSensitivity: 9,
          drillData: {
            historicalTemp: [-25, -23, -20, -18, -15],
            co2Levels: [280, 310, 350, 390, 415],
            layerStrength: [9, 8, 7, 6, 5]
          }
        },
        {
          name: "Perito Moreno",
          description: "Located in the Los Glaciares National Park in southwest Santa Cruz Province, Argentina. It is one of the few glaciers in the world that is currently in equilibrium rather than retreating.",
          iceThickness: 170,
          surfaceArea: 250,
          stability: 85,
          tempSensitivity: 4,
          drillData: {
            historicalTemp: [-10, -9, -8, -7, -6],
            co2Levels: [285, 315, 345, 385, 418],
            layerStrength: [8, 8, 7, 7, 7]
          }
        },
        {
          name: "Great Aletsch Glacier",
          description: "The largest glacier in the eastern Bernese Alps in the Swiss canton of Valais. It has a length of about 23 km and covers more than 80 square km.",
          iceThickness: 900,
          surfaceArea: 81,
          stability: 55,
          tempSensitivity: 7,
          drillData: {
            historicalTemp: [-15, -14, -13, -11, -9],
            co2Levels: [278, 305, 335, 375, 410],
            layerStrength: [7, 7, 6, 5, 4]
          }
        }
      ];

      const created = [];
      for (const f of fallbackData) {
        created.push(await storage.createGlacier(f));
      }
      res.json(created);
    }
  });

  app.get(api.glaciers.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const glacier = await storage.getGlacier(id);
    if (!glacier) {
      return res.status(404).json({ message: "Glacier not found" });
    }
    res.json(glacier);
  });

  // Refresh glaciers - clears existing and generates new ones via AI
  app.post(api.glaciers.refresh.path, async (req, res) => {
    try {
      await storage.clearGlaciers();
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are a scientific research assistant specializing in glaciology. Provide authentic, real-world telemetry for exactly 3 major glaciers currently existing on Earth. Select any 3 significant glaciers from across the globe (e.g., in Antarctica, Greenland, the Himalayas, the Andes, the Alps, etc.). For each glacier, provide: name, iceThickness (meters), surfaceArea (sq km), stability (0-100), tempSensitivity (1-10), and a detailed 2-sentence description including its specific geographic coordinates and regional context. Also provide realistic historical drill data based on actual scientific records: historicalTemp (5 values in Celsius, negative), co2Levels (5 values in ppm from 280-420), and layerStrength (5 values from 1-10). Respond ONLY with a JSON object containing a 'glaciers' array with exactly 3 glaciers.` 
          },
          { role: "user", content: `Establish satellite uplink and fetch telemetry for 3 unique real-world glaciers. Reference current climate data. Seed: ${Date.now()}` }
        ],
        response_format: { type: "json_object" }
      });

      const rawContent = response.choices[0].message.content || "{}";
      const data = JSON.parse(rawContent);
      const glaciersList = data.glaciers || [];
      
      const createdGlaciers = [];
      for (const g of glaciersList) {
        const glacier = await storage.createGlacier({
          name: g.name || "Unknown Glacier",
          description: g.description || `A unique glacier discovered in a remote region.`,
          iceThickness: Math.round(Number(g.iceThickness)) || 500,
          surfaceArea: Math.round(Number(g.surfaceArea)) || 100,
          stability: Math.round(Number(g.stability)) || 80,
          tempSensitivity: Math.round(Number(g.tempSensitivity)) || 5,
          drillData: g.drillData || {
            historicalTemp: [-20, -18, -15, -12, -10],
            co2Levels: [280, 310, 340, 380, 410],
            layerStrength: [9, 8, 7, 6, 5]
          }
        });
        createdGlaciers.push(glacier);
      }

      res.json(createdGlaciers);
    } catch (err) {
      console.error("AI Glacier Refresh Error:", err);
      res.status(500).json({ message: "Failed to refresh glaciers" });
    }
  });

  app.get(api.scores.list.path, async (req, res) => {
    const list = await storage.getScores();
    res.json(list);
  });

  app.post(api.scores.create.path, async (req, res) => {
    try {
      const input = api.scores.create.input.parse(req.body);
      const score = await storage.createScore(input);
      res.status(201).json(score);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.ai.predict.path, async (req, res) => {
    try {
      const input = api.ai.predict.input.parse(req.body);
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a glaciologist. Based on the provided glacier stats and environmental conditions, provide a concise 2-sentence prediction of the glacier's survival probability and main risk factors." 
          },
          { 
            role: "user", 
            content: `Glacier: ${input.glacierName}. Stats: Thickness ${input.stats.thickness}m, Stability ${input.stats.stability}%, Volume ${input.stats.volume}km3. Environment: Temp Offset ${input.environment.globalTemp}C, Snowfall ${input.environment.snowfall}x, Emissions ${input.environment.emissions}x, Ocean Temp ${input.environment.oceanTemp}C.` 
          }
        ]
      });

      res.json({ prediction: response.choices[0].message.content || "Prediction unavailable." });
    } catch (err) {
      res.status(500).json({ message: "AI Prediction failed" });
    }
  });

  return httpServer;
}

function generateRandomGlacier(id: number) {
  const names = ["Aletsch", "Furtwängler", "Jakobshavn", "Lambert", "Perito Moreno", "Vatnajökull", "Yulong", "Gangotri"];
  const descriptors = ["Ancient", "Receding", "Towering", "Hidden", "Shadow", "Crystal", "Forgotten", "Sturdy"];
  
  const name = `${descriptors[Math.floor(Math.random() * descriptors.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
  const thickness = 500 + Math.floor(Math.random() * 2000);
  const area = 100 + Math.floor(Math.random() * 800);
  const sensitivity = 2 + Math.floor(Math.random() * 7);
  
  return {
    id,
    name,
    description: `A unique ${sensitivity > 6 ? "highly sensitive" : "resilient"} glacier discovered in a remote region.`,
    iceThickness: thickness,
    surfaceArea: area,
    stability: 80 + Math.floor(Math.random() * 20),
    tempSensitivity: sensitivity,
    drillData: {
      historicalTemp: Array.from({ length: 5 }).map(() => -30 + Math.random() * 20),
      co2Levels: Array.from({ length: 5 }).map(() => 280 + Math.random() * 150),
      layerStrength: Array.from({ length: 5 }).map(() => 4 + Math.random() * 6)
    }
  };
}
