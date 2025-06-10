// import { validatorCache } from '@/lib/cache/validator-cache';
// import { validatorService } from '@/lib/services/validatorService';
// import Redis from 'ioredis';
// import { Validator } from '@prisma/client';

// // Mock Redis
// jest.mock('ioredis');
// const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

// // Mock validator service
// jest.mock('@/lib/services/validatorService');
// const mockedValidatorService = validatorService as jest.Mocked<typeof validatorService>;

// // Mock cache monitor to avoid side effects
// jest.mock('@/lib/cache/cache-monitor', () => ({
//   cacheMonitor: {
//     recordCacheHit: jest.fn(),
//     recordCacheMiss: jest.fn(),
//   },
// }));

// // Mock environment variables
// const originalEnv = process.env;

// beforeEach(() => {
//   jest.resetModules();
//   process.env = { ...originalEnv };
//   jest.clearAllMocks();
// });

// afterEach(() => {
//   process.env = originalEnv;
// });

// describe('ValidatorCache', () => {
//   const mockValidators: any[] = [
//     {
//       id: '1',
//       profileName: 'Test Validator 1',
//       provider: 'openai',
//       modelName: 'gpt-4',
//       publicKey: 'test-public-key-1',
//       isLeader: true,
//       active: true,
//       description: 'Test validator 1 description',
//       avatarUrl: 'https://example.com/avatar1.png',
//       validatorType: 'PRIMARY',
//       reliability: 0.95,
//       totalVotes: 100,
//       correctVotes: 95,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       apiKeys: [
//         {
//           id: 'vk1',
//           validatorId: '1',
//           apiKeyId: 'ak1',
//           createdAt: new Date(),
//         },
//       ],
//     },
//     {
//       id: '2',
//       profileName: 'Test Validator 2',
//       provider: 'anthropic',
//       modelName: 'claude-3',
//       publicKey: 'test-public-key-2',
//       isLeader: false,
//       active: false,
//       description: 'Test validator 2 description',
//       avatarUrl: 'https://example.com/avatar2.png',
//       validatorType: 'BACKUP',
//       reliability: 0.85,
//       totalVotes: 50,
//       correctVotes: 42,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       apiKeys: [
//         {
//           id: 'vk2',
//           validatorId: '2',
//           apiKeyId: 'ak2',
//           createdAt: new Date(),
//         },
//       ],
//     },
//   ];

//   describe('Cache Hit Scenarios', () => {
//     it('should return cached data on cache hit', async () => {
//       const mockRedisInstance = {
//         get: jest.fn().mockResolvedValue(JSON.stringify(mockValidators)),
//         set: jest.fn().mockResolvedValue('OK'),
//         del: jest.fn().mockResolvedValue(1),
//         ttl: jest.fn().mockResolvedValue(300),
//         quit: jest.fn().mockResolvedValue('OK'),
//         on: jest.fn(),
//       };
//       MockedRedis.mockImplementation(() => mockRedisInstance as any);

//       const result = await validatorCache.getValidators();

//       expect(result).toEqual(mockValidators);
//       expect(mockRedisInstance.get).toHaveBeenCalledWith('validator_list_v1');
//       expect(mockedValidatorService.getAllValidatorsFromDB).not.toHaveBeenCalled();
//     });

//     it('should fetch from DB on cache miss', async () => {
//       const mockRedisInstance = {
//         get: jest.fn().mockResolvedValue(null),
//         set: jest.fn().mockResolvedValue('OK'),
//         del: jest.fn().mockResolvedValue(1),
//         ttl: jest.fn().mockResolvedValue(300),
//         quit: jest.fn().mockResolvedValue('OK'),
//         on: jest.fn(),
//       };
//       MockedRedis.mockImplementation(() => mockRedisInstance as any);
//       mockedValidatorService.getAllValidatorsFromDB.mockResolvedValue(mockValidators);

//       const result = await validatorCache.getValidators();

//       expect(result).toEqual(mockValidators);
//       expect(mockRedisInstance.get).toHaveBeenCalledWith('validator_list_v1');
//       expect(mockedValidatorService.getAllValidatorsFromDB).toHaveBeenCalled();
//       expect(mockRedisInstance.set).toHaveBeenCalledWith(
//         'validator_list_v1',
//         JSON.stringify(mockValidators),
//         'EX',
//         600
//       );
//     });
//   });

//   describe('Error Handling', () => {
//     it('should fallback to in-memory cache when Redis fails', async () => {
//       const mockRedisInstance = {
//         get: jest.fn().mockRejectedValue(new Error('Redis connection error')),
//         set: jest.fn().mockRejectedValue(new Error('Redis connection error')),
//         del: jest.fn().mockResolvedValue(1),
//         ttl: jest.fn().mockResolvedValue(300),
//         quit: jest.fn().mockResolvedValue('OK'),
//         on: jest.fn(),
//       };
//       MockedRedis.mockImplementation(() => mockRedisInstance as any);
//       mockedValidatorService.getAllValidatorsFromDB.mockResolvedValue(mockValidators);

//       const result1 = await validatorCache.getValidators();
//       expect(result1).toEqual(mockValidators);
//       expect(mockedValidatorService.getAllValidatorsFromDB).toHaveBeenCalledTimes(1);

//       // Second call should use in-memory cache
//       const result2 = await validatorCache.getValidators();
//       expect(result2).toEqual(mockValidators);
//       expect(mockedValidatorService.getAllValidatorsFromDB).toHaveBeenCalledTimes(1);
//     });

//     it('should handle invalid cached data gracefully', async () => {
//       const mockRedisInstance = {
//         get: jest.fn().mockResolvedValue('invalid json'),
//         set: jest.fn().mockResolvedValue('OK'),
//         del: jest.fn().mockResolvedValue(1),
//         ttl: jest.fn().mockResolvedValue(300),
//         quit: jest.fn().mockResolvedValue('OK'),
//         on: jest.fn(),
//       };
//       MockedRedis.mockImplementation(() => mockRedisInstance as any);
//       mockedValidatorService.getAllValidatorsFromDB.mockResolvedValue(mockValidators);

//       const result = await validatorCache.getValidators();

//       expect(result).toEqual(mockValidators);
//       expect(mockedValidatorService.getAllValidatorsFromDB).toHaveBeenCalled();
//     });
//   });

//   describe('Cache Invalidation', () => {
//     it('should clear both Redis and in-memory cache on invalidation', async () => {
//       const mockRedisInstance = {
//         get: jest.fn().mockResolvedValue(JSON.stringify(mockValidators)),
//         set: jest.fn().mockResolvedValue('OK'),
//         del: jest.fn().mockResolvedValue(1),
//         ttl: jest.fn().mockResolvedValue(300),
//         quit: jest.fn().mockResolvedValue('OK'),
//         on: jest.fn(),
//       };
//       MockedRedis.mockImplementation(() => mockRedisInstance as any);

//       await validatorCache.invalidateCache();

//       expect(mockRedisInstance.del).toHaveBeenCalledWith('validator_list_v1');
//     });

//     it('should warm cache after invalidation when configured', async () => {
//       process.env.WARM_CACHE_ON_INVALIDATE = 'true';

//       const mockRedisInstance = {
//         get: jest.fn().mockResolvedValue(null),
//         set: jest.fn().mockResolvedValue('OK'),
//         del: jest.fn().mockResolvedValue(1),
//         ttl: jest.fn().mockResolvedValue(300),
//         quit: jest.fn().mockResolvedValue('OK'),
//         on: jest.fn(),
//       };
//       MockedRedis.mockImplementation(() => mockRedisInstance as any);
//       mockedValidatorService.getAllValidatorsFromDB.mockResolvedValue(mockValidators);

//       await validatorCache.invalidateCache();

//       expect(mockRedisInstance.del).toHaveBeenCalled();
//       expect(mockedValidatorService.getAllValidatorsFromDB).toHaveBeenCalled();
//       expect(mockRedisInstance.set).toHaveBeenCalled();
//     });
//   });

//   describe('Cache Status', () => {
//     it('should return correct cache status when cache is hit', async () => {
//       const mockRedisInstance = {
//         get: jest.fn().mockResolvedValue(JSON.stringify(mockValidators)),
//         set: jest.fn().mockResolvedValue('OK'),
//         del: jest.fn().mockResolvedValue(1),
//         ttl: jest.fn().mockResolvedValue(300),
//         quit: jest.fn().mockResolvedValue('OK'),
//         on: jest.fn(),
//       };
//       MockedRedis.mockImplementation(() => mockRedisInstance as any);

//       await validatorCache.getValidators();
//       const status = await validatorCache.getCacheStatus();

//       expect(status.isHit).toBe(true);
//       expect(status.size).toBe(mockValidators.length);
//       expect(status.ttl).toBe(300);
//     });

//     it('should return correct cache status when cache is empty', async () => {
//       const mockRedisInstance = {
//         get: jest.fn().mockResolvedValue(null),
//         set: jest.fn().mockResolvedValue('OK'),
//         del: jest.fn().mockResolvedValue(1),
//         ttl: jest.fn().mockResolvedValue(-2),
//         quit: jest.fn().mockResolvedValue('OK'),
//         on: jest.fn(),
//       };
//       MockedRedis.mockImplementation(() => mockRedisInstance as any);

//       const status = await validatorCache.getCacheStatus();

//       expect(status.isHit).toBe(false);
//       expect(status.size).toBe(0);
//       expect(status.ttl).toBe(0);
//     });
//   });

//   describe('Configuration', () => {
//     it('should respect VALIDATOR_CACHE_ENABLED setting', async () => {
//       process.env.VALIDATOR_CACHE_ENABLED = 'false';
//       mockedValidatorService.getAllValidatorsFromDB.mockResolvedValue(mockValidators);

//       const result = await validatorCache.getValidators();

//       expect(result).toEqual(mockValidators);
//       expect(mockedValidatorService.getAllValidatorsFromDB).toHaveBeenCalled();
//     });

//     it('should use custom TTL from environment', async () => {
//       process.env.VALIDATOR_CACHE_TTL = '1200';

//       const mockRedisInstance = {
//         get: jest.fn().mockResolvedValue(null),
//         set: jest.fn().mockResolvedValue('OK'),
//         del: jest.fn().mockResolvedValue(1),
//         ttl: jest.fn().mockResolvedValue(300),
//         quit: jest.fn().mockResolvedValue('OK'),
//         on: jest.fn(),
//       };
//       MockedRedis.mockImplementation(() => mockRedisInstance as any);
//       mockedValidatorService.getAllValidatorsFromDB.mockResolvedValue(mockValidators);

//       await validatorCache.getValidators();

//       expect(mockRedisInstance.set).toHaveBeenCalledWith(
//         'validator_list_v1',
//         JSON.stringify(mockValidators),
//         'EX',
//         1200
//       );
//     });
//   });
// });
