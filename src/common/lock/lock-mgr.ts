import { Injectable } from '@nestjs/common';

// lock, concurrent
@Injectable()
export class LockManager {
    private locks: Map<number, Promise<void>> = new Map();
  
    async withLock<T>(userId: number, operation: () => Promise<T>): Promise<T> {
      const release = await this.acquireLock(userId);
      try {
        return await operation();
      } finally {
        release();
      }
    }
  
    private async acquireLock(userId: number): Promise<() => void> {
      const currentLock = this.locks.get(userId) || Promise.resolve();
      let releaseLock: () => void;
      const newLock = new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
      this.locks.set(userId, currentLock.then(() => newLock));
      await currentLock;
      return releaseLock!;
    }
  }