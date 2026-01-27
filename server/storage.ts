import { glaciers, scores, type Glacier, type Score, type InsertScore } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Glaciers
  getGlaciers(): Promise<Glacier[]>;
  getGlacier(id: number): Promise<Glacier | undefined>;
  createGlacier(glacier: any): Promise<Glacier>;
  clearGlaciers(): Promise<void>;

  // Scores
  getScores(): Promise<Score[]>;
  createScore(score: InsertScore): Promise<Score>;
}

export class DatabaseStorage implements IStorage {
  // Glaciers
  async getGlaciers(): Promise<Glacier[]> {
    return await db.select().from(glaciers);
  }

  async getGlacier(id: number): Promise<Glacier | undefined> {
    const [glacier] = await db
      .select()
      .from(glaciers)
      .where(eq(glaciers.id, id));
    return glacier;
  }

  async createGlacier(glacier: any): Promise<Glacier> {
    const [newGlacier] = await db.insert(glaciers).values(glacier).returning();
    return newGlacier;
  }

  async clearGlaciers(): Promise<void> {
    await db.delete(glaciers);
  }

  // Scores
  async getScores(): Promise<Score[]> {
    return await db
      .select()
      .from(scores)
      .orderBy(desc(scores.score))
      .limit(10);
  }

  async createScore(score: InsertScore): Promise<Score> {
    const [newScore] = await db.insert(scores).values(score).returning();
    return newScore;
  }
}

export const storage = new DatabaseStorage();
