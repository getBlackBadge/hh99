import { LockManager } from './lock-mgr';

describe('LockManager', () => {
  let lockManager: LockManager;

  beforeEach(() => {
    lockManager = new LockManager();
  });

  test('withLock should execute operations sequentially for the same user', async () => {
    const userId = 1;
    const results: number[] = [];

    const operation1 = jest.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      results.push(1);
    });

    const operation2 = jest.fn().mockImplementation(async () => {
      results.push(2);
    });

    await Promise.all([
      lockManager.withLock(userId, operation1),
      lockManager.withLock(userId, operation2),
    ]);

    expect(results).toEqual([1, 2]);
    expect(operation1).toHaveBeenCalledTimes(1);
    expect(operation2).toHaveBeenCalledTimes(1);
  });

  test('withLock should allow concurrent operations for different users', async () => {
    const user1 = 1;
    const user2 = 2;
    const results: number[] = [];

    const operation1 = jest.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      results.push(1);
    });

    const operation2 = jest.fn().mockImplementation(async () => {
      results.push(2);
    });

    await Promise.all([
      lockManager.withLock(user1, operation1),
      lockManager.withLock(user2, operation2),
    ]);

    expect(results).toEqual([2, 1]);
    expect(operation1).toHaveBeenCalledTimes(1);
    expect(operation2).toHaveBeenCalledTimes(1);
  });

  test('withLock should release the lock after operation completion', async () => {
    const userId = 1;
    let lockReleased = false;

    const operation1 = jest.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const operation2 = jest.fn().mockImplementation(async () => {
      lockReleased = true;
    });

    await lockManager.withLock(userId, operation1);
    await lockManager.withLock(userId, operation2);

    expect(lockReleased).toBe(true);
    expect(operation1).toHaveBeenCalledTimes(1);
    expect(operation2).toHaveBeenCalledTimes(1);
  });
});