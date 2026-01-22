import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.glaciers.list.path, async (req, res) => {
    // Generate 3 random glaciers for each request
    const randomGlaciers = Array.from({ length: 3 }).map(() => generateRandomGlacier());
    res.json(randomGlaciers);
  });

  app.get(api.glaciers.get.path, async (req, res) => {
    // For specific ID, we'll just return a random one with that ID for simplicity
    // since we are moving to dynamic generation
    const glacier = generateRandomGlacier();
    glacier.id = Number(req.params.id);
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

  return httpServer;
}

const names = ["Aletsch", "Furtwängler", "Jakobshavn", "Lambert", "Perito Moreno", "Vatnajökull", "Yulong", "Gangotri"];
const descriptors = ["Ancient", "Receding", "Towering", "Hidden", "Shadow", "Crystal", "Forgotten", "Sturdy"];

function generateRandomGlacier() {
  const name = `${descriptors[Math.floor(Math.random() * descriptors.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
  const thickness = 500 + Math.floor(Math.random() * 2000);
  const area = 100 + Math.floor(Math.random() * 800);
  const sensitivity = 2 + Math.floor(Math.random() * 7);
  
  return {
    id: Math.floor(Math.random() * 1000000),
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
