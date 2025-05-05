import Redis from 'ioredis';
import { Validator } from './types';

// Redis client configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export let redis: Redis | null = null;

// Initialize Redis client only in production or if explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_REDIS === 'true') {
  try {
    redis = new Redis(redisUrl, {
      connectTimeout: 1000, // Short timeout to fail fast
      maxRetriesPerRequest: 0, // Disable retries
      enableOfflineQueue: false, // Prevent queuing
    });

    redis.on('error', () => {
      // console.warn('[ioredis] Connection error:', error.message);
      redis = null; // Fallback to null on error
    });
  } catch {
    // console.warn('[ioredis] Failed to initialize:', (error as Error).message);
    redis = null;
  }
}

// Redis channels
export const QUERY_CHANNEL = 'query_channel';
export const LEADERSHIP_KEY = 'leader_schedule';

// Interface for leadership data
interface LeadershipData {
  currentLeader: string;
  nextLeader: string;
  schedule: string[];
}

// Initialize Redis with leadership data (called during app startup)
export async function initializeLeadership(validators: Validator[]): Promise<void> {
  if (!redis) {
    console.warn('Redis unavailable, skipping leadership initialization');
    return;
  }

  try {
    const leadershipExists = await redis.exists(LEADERSHIP_KEY);

    if (!leadershipExists) {
      const initialLeadership: LeadershipData = {
        currentLeader: validators[0]?.id || '',
        nextLeader: validators[1]?.id || '',
        schedule: validators.map((v) => v.id),
      };

      await redis.set(LEADERSHIP_KEY, JSON.stringify(initialLeadership));
      console.log('Leadership initialized in Redis');
    } else {
      console.log('Leadership data already exists in Redis');
    }
  } catch (error) {
    console.warn('[ioredis] Error in initializeLeadership:', (error as Error).message);
  }
}

// Get current leadership data
export async function getLeadershipData(): Promise<LeadershipData | null> {
  if (!redis) {
    console.warn('Redis unavailable, returning null leadership data');
    return null;
  }

  try {
    const data = await redis.get(LEADERSHIP_KEY);
    return data ? (JSON.parse(data) as LeadershipData) : null;
  } catch (error) {
    console.warn('[ioredis] Error in getLeadershipData:', (error as Error).message);
    return null;
  }
}

// Update leadership after consensus
export async function rotateLeadership(): Promise<boolean> {
  if (!redis) {
    console.warn('Redis unavailable, skipping leadership rotation');
    return false;
  }

  try {
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
  } catch (error) {
    console.warn('[ioredis] Error in rotateLeadership:', (error as Error).message);
    return false;
  }
}

// Publish a query to all validators
export async function publishQuery(query: string): Promise<number> {
  if (!redis) {
    console.warn('Redis unavailable, skipping query publish');
    return 0;
  }

  try {
    const message = JSON.stringify({
      question: query,
      timestamp: new Date().toISOString(),
    });
    return await redis.publish(QUERY_CHANNEL, message);
  } catch (error) {
    console.warn('[ioredis] Error in publishQuery:', (error as Error).message);
    return 0;
  }
}

// Subscribe to queries (called in validator service)
export function subscribeToQueries(callback: (query: string) => void): Redis | null {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_REDIS === 'true') {
    try {
      const subscriber = new Redis(redisUrl, {
        connectTimeout: 1000,
        maxRetriesPerRequest: 0,
        enableOfflineQueue: false,
      });

      subscriber
        .subscribe(QUERY_CHANNEL)
        .then(() => {
          console.log('Subscribed to query channel');
        })
        .catch((err) => {
          console.error('Failed to subscribe to query channel:', err);
        });

      subscriber.on('message', (channel: string, message: string) => {
        if (channel === QUERY_CHANNEL) {
          try {
            const data = JSON.parse(message) as { question: string };
            callback(data.question);
          } catch (error) {
            console.error('Error processing query message:', error);
          }
        }
      });

      subscriber.on('error', (error) => {
        console.warn('[ioredis] Subscriber error:', error.message);
      });

      return subscriber;
    } catch (error) {
      console.warn('[ioredis] Failed to initialize subscriber:', (error as Error).message);
      return null;
    }
  }

  console.warn('Redis unavailable, skipping query subscription');
  return null;
}