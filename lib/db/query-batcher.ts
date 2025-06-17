/**
 * Query batcher for combining concurrent requests into single database queries
 * This helps reduce database load and improve performance
 */

export class QueryBatcher<TInput, TResult> {
  private pending = new Map<string, Promise<TResult>>();
  private batch: { key: string; input: TInput; resolve: (result: TResult) => void; reject: (error: unknown) => void }[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private batchFn: (inputs: TInput[]) => Promise<Map<string, TResult>>,
    private batchDelay = 10 // 10ms delay to collect requests
  ) {}

  /**
   * Get result for a single input, batching with other concurrent requests
   */
  async get(key: string, input: TInput): Promise<TResult> {
    // Check if already pending
    const pending = this.pending.get(key);
    if (pending) return pending;

    // Create new promise
    const promise = new Promise<TResult>((resolve, reject) => {
      this.batch.push({ key, input, resolve, reject });
      
      if (!this.timer) {
        this.timer = setTimeout(() => this.processBatch(), this.batchDelay);
      }
    });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Process the current batch
   */
  private async processBatch() {
    const currentBatch = this.batch;
    this.batch = [];
    this.timer = null;

    try {
      const inputs = currentBatch.map(item => item.input);
      const results = await this.batchFn(inputs);
      
      currentBatch.forEach(({ key, resolve, reject }) => {
        const result = results.get(key);
        if (result !== undefined) {
          resolve(result);
        } else {
          reject(new Error(`No result for key: ${key}`));
        }
        this.pending.delete(key);
      });
    } catch (error) {
      currentBatch.forEach(({ key, reject }) => {
        reject(error);
        this.pending.delete(key);
      });
    }
  }

  /**
   * Clear all pending requests
   */
  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.batch = [];
    this.pending.clear();
  }
}