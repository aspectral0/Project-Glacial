import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Initial glacier scenarios available for selection
export const glaciers = pgTable("glaciers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  // Initial Stats
  iceThickness: integer("ice_thickness").notNull(), // meters
  surfaceArea: integer("surface_area").notNull(), // sq km
  stability: integer("stability").notNull(), // 0-100%
  tempSensitivity: integer("temp_sensitivity").notNull(), // 1-10 scale (higher = melts faster)
  // Hidden/Drillable Data stored as JSON
  drillData: jsonb("drill_data").$type<{
    historicalTemp: number[];
    co2Levels: number[];
    layerStrength: number[];
  }>().notNull(),
});

// Leaderboard/History
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  glacierName: text("glacier_name").notNull(),
  yearsSurvived: integer("years_survived").notNull(),
  finalIceVolume: integer("final_ice_volume").notNull(),
  score: integer("score").notNull(),
  playedAt: text("played_at").notNull(), // ISO string
});

// === SCHEMAS ===

export const insertGlacierSchema = createInsertSchema(glaciers);
export const insertScoreSchema = createInsertSchema(scores);

// === TYPES ===

export type Glacier = typeof glaciers.$inferSelect;
export type InsertGlacier = z.infer<typeof insertGlacierSchema>;
export type Score = typeof scores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;

// Simulation State Types (for frontend)
export interface SimulationState {
  year: number;
  isRunning: boolean;
  isGameOver: boolean;
  health: number; // 0-100
  glacierStats: {
    thickness: number;
    area: number;
    stability: number;
    volume: number;
  };
  environmentalFactors: {
    globalTemp: number; // offset in C
    snowfall: number; // multiplier 0-2
    emissions: number; // multiplier 0-2
    oceanTemp: number; // offset in C
  };
}
