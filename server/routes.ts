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
      // First try to get from database
      const existingGlaciers = await storage.getGlaciers();
      if (existingGlaciers.length > 0) {
        return res.json(existingGlaciers);
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a scientific data generator. Return a JSON object with a 'glaciers' key containing an array of 3 real-world glaciers with their current stats (name, iceThickness in meters, surfaceArea in sq km, stability 0-100, tempSensitivity 1-10, and a description) and randomized historical drill data (historicalTemp array of 5 numbers, co2Levels array of 5 numbers, layerStrength array of 5 numbers). Respond ONLY with valid JSON." 
          },
          { role: "user", content: "Generate 3 real-world glaciers." }
        ],
        response_format: { type: "json_object" }
      });

      const rawContent = response.choices[0].message.content || "{}";
      const data = JSON.parse(rawContent);
      const glaciersList = data.glaciers || data.items || data.data || [];
      
      const createdGlaciers = [];
      for (const g of glaciersList) {
        const glacier = await storage.createGlacier({
          name: g.name || "Unknown Glacier",
          description: g.description || `A unique glacier discovered in a remote region.`,
          iceThickness: Number(g.iceThickness) || 500,
          surfaceArea: Number(g.surfaceArea) || 100,
          stability: Number(g.stability) || 80,
          tempSensitivity: Number(g.tempSensitivity) || 5,
          drillData: g.drillData || {
            historicalTemp: [-20, -18, -15, -12, -10],
            co2Levels: [280, 310, 340, 380, 410],
            layerStrength: [9, 8, 7, 6, 5]
          }
        });
        createdGlaciers.push(glacier);
      }

      if (createdGlaciers.length === 0) {
        throw new Error("AI returned empty glacier list");
      }

      res.json(createdGlaciers);
    } catch (err) {
      console.error("AI Glacier List Error:", err);
      const existing = await storage.getGlaciers();
      if (existing.length > 0) return res.json(existing);
      
      const randomGlaciers = [];
      const fallbackData = [
        { name: "Jakobshavn Isbræ", location: "Greenland" },
        { name: "Lambert Glacier", location: "Antarctica" },
        { name: "Perito Moreno", location: "Argentina" }
      ];
      
      for (let i = 0; i < 3; i++) {
        const fallback = fallbackData[i];
        const g = await storage.createGlacier({
          name: fallback.name,
          description: `A significant glacier located in ${fallback.location}.`,
          iceThickness: 800 + Math.floor(Math.random() * 500),
          surfaceArea: 200 + Math.floor(Math.random() * 300),
          stability: 70 + Math.floor(Math.random() * 20),
          tempSensitivity: 4 + Math.floor(Math.random() * 4),
          drillData: {
            historicalTemp: [-20, -18, -15, -12, -10],
            co2Levels: [280, 310, 340, 380, 410],
            layerStrength: [9, 8, 7, 6, 5]
          }
        });
        randomGlaciers.push(g);
      }
      res.json(randomGlaciers);
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
