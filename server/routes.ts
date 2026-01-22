import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === Glaciers ===
  app.get(api.glaciers.list.path, async (req, res) => {
    const list = await storage.getGlaciers();
    res.json(list);
  });

  app.get(api.glaciers.get.path, async (req, res) => {
    const glacier = await storage.getGlacier(Number(req.params.id));
    if (!glacier) {
      return res.status(404).json({ message: 'Glacier not found' });
    }
    res.json(glacier);
  });

  // === Scores ===
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

  // Seed data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getGlaciers();
  if (existing.length === 0) {
    // 1. The Titan (Huge but sensitive)
    await storage.createGlacier({
      name: "Titanus Glacies",
      description: "A massive, ancient glacier. Thick ice but highly sensitive to temperature changes due to its location.",
      iceThickness: 2000,
      surfaceArea: 500,
      stability: 100,
      tempSensitivity: 8,
      drillData: {
        historicalTemp: [-20, -19, -18, -15, -10],
        co2Levels: [280, 300, 320, 350, 400],
        layerStrength: [9, 9, 8, 7, 5]
      }
    });

    // 2. The Fortress (Stable but small)
    await storage.createGlacier({
      name: "Fortress Peak",
      description: "Small, compact glacier in a high-altitude valley. Very stable but has low volume reserves.",
      iceThickness: 800,
      surfaceArea: 150,
      stability: 100,
      tempSensitivity: 4,
      drillData: {
        historicalTemp: [-30, -30, -29, -29, -28],
        co2Levels: [280, 290, 300, 310, 320],
        layerStrength: [10, 10, 10, 9, 9]
      }
    });

    // 3. The Balanced (Average)
    await storage.createGlacier({
      name: "Equinox Fields",
      description: "A balanced glacier with moderate thickness and sensitivity. Good for beginners.",
      iceThickness: 1200,
      surfaceArea: 300,
      stability: 100,
      tempSensitivity: 6,
      drillData: {
        historicalTemp: [-25, -24, -22, -20, -18],
        co2Levels: [280, 310, 330, 360, 390],
        layerStrength: [9, 8, 8, 7, 6]
      }
    });
  }
}
