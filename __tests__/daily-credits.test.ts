import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/cron/daily-credits/route';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    rpc: jest.fn(),
  })),
}));

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  CRON_SECRET: 'test-cron-secret',
};

describe('Daily Credit Allocation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env;
    // Set test env
    process.env = { ...originalEnv, ...mockEnv };
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('GET /api/cron/daily-credits', () => {
    it('should reject unauthorized requests', async () => {
      const request = new NextRequest('http://localhost/api/cron/daily-credits', {
        headers: {
          'authorization': 'Bearer wrong-secret',
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should successfully allocate credits to all users', async () => {
      const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;
      const mockRpc = jest.fn().mockResolvedValue({
        data: {
          success: true,
          allocation_date: '2025-01-09',
          users_updated: 100,
          users_failed: 0,
          users_skipped: 20,
          total_credits_allocated: 1000,
          total_users: 120,
          execution_time_ms: 1500,
        },
        error: null,
      });

      (mockSupabase as any).mockReturnValue({
        rpc: mockRpc,
      });

      const request = new NextRequest('http://localhost/api/cron/daily-credits', {
        headers: {
          'authorization': `Bearer ${mockEnv.CRON_SECRET}`,
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.users_updated).toBe(100);
      expect(data.users_failed).toBe(0);
      expect(data.total_credits_allocated).toBe(1000);
      
      // Verify RPC was called correctly
      expect(mockRpc).toHaveBeenCalledWith('allocate_daily_credits', {
        p_force: false,
      });
    });

    it('should handle already allocated error gracefully', async () => {
      const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;
      const mockRpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Credits already allocated today' },
      });

      (mockSupabase as any).mockReturnValue({
        rpc: mockRpc,
      });

      const request = new NextRequest('http://localhost/api/cron/daily-credits', {
        headers: {
          'authorization': `Bearer ${mockEnv.CRON_SECRET}`,
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Credits already allocated today');
    });

    it('should handle database errors', async () => {
      const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;
      const mockRpc = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      (mockSupabase as any).mockReturnValue({
        rpc: mockRpc,
      });

      const request = new NextRequest('http://localhost/api/cron/daily-credits', {
        headers: {
          'authorization': `Bearer ${mockEnv.CRON_SECRET}`,
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/cron/daily-credits', () => {
    it('should allow manual trigger with force parameter', async () => {
      const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;
      const mockRpc = jest.fn().mockResolvedValue({
        data: {
          success: true,
          allocation_date: '2025-01-09',
          users_updated: 120,
          users_failed: 0,
          users_skipped: 0,
          total_credits_allocated: 1200,
          total_users: 120,
          execution_time_ms: 1800,
        },
        error: null,
      });

      (mockSupabase as any).mockReturnValue({
        rpc: mockRpc,
      });

      const request = new NextRequest('http://localhost/api/cron/daily-credits', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${mockEnv.CRON_SECRET}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.manual_trigger).toBe(true);
      expect(data.forced).toBe(true);
      
      // Verify RPC was called with force parameter
      expect(mockRpc).toHaveBeenCalledWith('allocate_daily_credits', {
        p_force: true,
      });
    });
  });

  describe('Credit Allocation Logic', () => {
    it('should not double-allocate if job runs multiple times', async () => {
      const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;
      const mockRpc = jest.fn()
        .mockResolvedValueOnce({
          data: {
            success: true,
            users_updated: 100,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            success: false,
            message: 'Credits already allocated today',
          },
          error: null,
        });

      (mockSupabase as any).mockReturnValue({
        rpc: mockRpc,
      });

      const request = new NextRequest('http://localhost/api/cron/daily-credits', {
        headers: {
          'authorization': `Bearer ${mockEnv.CRON_SECRET}`,
        },
      });

      // First call - should succeed
      const response1 = await GET(request);
      const data1 = await response1.json();
      expect(data1.success).toBe(true);

      // Second call - should return already allocated
      const response2 = await GET(request);
      const data2 = await response2.json();
      expect(data2.success).toBe(false);
      expect(data2.message).toContain('already allocated');
    });

    it('should handle partial failures gracefully', async () => {
      const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;
      const mockRpc = jest.fn().mockResolvedValue({
        data: {
          success: true,
          allocation_date: '2025-01-09',
          users_updated: 95,
          users_failed: 5,
          users_skipped: 20,
          total_credits_allocated: 950,
          total_users: 120,
          execution_time_ms: 2000,
          errors: [
            { user_id: 'user1', error: 'Constraint violation' },
            { user_id: 'user2', error: 'Row locked' },
          ],
        },
        error: null,
      });

      (mockSupabase as any).mockReturnValue({
        rpc: mockRpc,
      });

      const request = new NextRequest('http://localhost/api/cron/daily-credits', {
        headers: {
          'authorization': `Bearer ${mockEnv.CRON_SECRET}`,
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.users_updated).toBe(95);
      expect(data.users_failed).toBe(5);
      expect(data.errors).toHaveLength(2);
    });
  });

  describe('Security', () => {
    it('should require CRON_SECRET environment variable', async () => {
      delete process.env.CRON_SECRET;

      const request = new NextRequest('http://localhost/api/cron/daily-credits', {
        headers: {
          'authorization': 'Bearer some-secret',
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Cron job not properly configured');
    });

    it('should require service role key for database operations', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = new NextRequest('http://localhost/api/cron/daily-credits', {
        headers: {
          'authorization': `Bearer ${mockEnv.CRON_SECRET}`,
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Performance', () => {
    it('should track execution time', async () => {
      const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;
      const mockRpc = jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: {
              success: true,
              users_updated: 100,
              execution_time_ms: 1500,
            },
            error: null,
          }), 100)
        )
      );

      (mockSupabase as any).mockReturnValue({
        rpc: mockRpc,
      });

      const request = new NextRequest('http://localhost/api/cron/daily-credits', {
        headers: {
          'authorization': `Bearer ${mockEnv.CRON_SECRET}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();
      
      expect(data.api_execution_time_ms).toBeGreaterThan(100);
      expect(data.execution_time_ms).toBe(1500);
    });
  });
});