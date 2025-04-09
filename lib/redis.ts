import Redis from "ioredis";
import { Validator } from "./types";

// Redis client configuration
export const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
);

// Redis channels
export const QUERY_CHANNEL = "query_channel";
export const LEADERSHIP_KEY = "leader_schedule";

// Interface for leadership data
interface LeadershipData {
  currentLeader: string;
  nextLeader: string;
  schedule: string[];
}

// Initialize Redis with leadership data (called during app startup)
export async function initializeLeadership(
  validators: Validator[],
): Promise<void> {
  const leadershipExists = await redis.exists(LEADERSHIP_KEY);

  if (!leadershipExists) {
    const initialLeadership: LeadershipData = {
      currentLeader: validators[0]?.id || "",
      nextLeader: validators[1]?.id || "",
      schedule: validators.map((v) => v.id),
    };

    await redis.set(LEADERSHIP_KEY, JSON.stringify(initialLeadership));
    console.log("Leadership initialized in Redis");
  } else {
    console.log("Leadership data already exists in Redis");
  }
}

// Get current leadership data
export async function getLeadershipData(): Promise<LeadershipData | null> {
  const data = await redis.get(LEADERSHIP_KEY);
  return data ? (JSON.parse(data) as LeadershipData) : null;
}

// Update leadership after consensus
export async function rotateLeadership(): Promise<boolean> {
  const data = await getLeadershipData();
  if (!data) return false;

  const { schedule } = data;
  const newSchedule = [...schedule.slice(1), schedule[0]]; // Rotate schedule

  const updatedLeadership: LeadershipData = {
    currentLeader: data.nextLeader,
    nextLeader: newSchedule[1] || newSchedule[0],
    schedule: newSchedule,
  };

  await redis.set(LEADERSHIP_KEY, JSON.stringify(updatedLeadership));
  return true;
}

// Publish a query to all validators
export async function publishQuery(query: string): Promise<number> {
  const message = JSON.stringify({
    question: query,
    timestamp: new Date().toISOString(),
  });
  return await redis.publish(QUERY_CHANNEL, message);
}

// Subscribe to queries (called in validator service)
export function subscribeToQueries(callback: (query: string) => void): Redis {
  const subscriber = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379",
  );

  // Fix the subscribe method to match the ioredis types
  subscriber
    .subscribe(QUERY_CHANNEL)
    .then(() => {
      console.log("Subscribed to query channel");
    })
    .catch((err) => {
      console.error("Failed to subscribe to query channel:", err);
    });

  subscriber.on("message", (channel: string, message: string) => {
    if (channel === QUERY_CHANNEL) {
      try {
        const data = JSON.parse(message) as { question: string };
        callback(data.question);
      } catch (error) {
        console.error("Error processing query message:", error);
      }
    }
  });

  return subscriber;
}
