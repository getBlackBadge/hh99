import { LockManager } from './lock-mgr';

describe('LockManager', () => {
  let lockManager: LockManager;

  beforeEach(() => {
    lockManager = new LockManager();
  });

  // 락이 잘 작동하는지 확인
  it('순서대로 작업을 실행한다', async () => {
    const userId = 1;
    const results: number[] = [];
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 동시에 여러 작업을 시작하지만, 순서대로 실행되어야 함
    await Promise.all([
      lockManager.withLock(userId, async () => {
        await delay(30);  // 첫 번째 작업이 가장 오래 걸림
        results.push(1);
      }),
      lockManager.withLock(userId, async () => {
        await delay(10);
        results.push(2);
      }),
      lockManager.withLock(userId, async () => {
        results.push(3);
      })
    ]);

    // 작업이 시작된 순서대로 결과가 추가되었는지 확인
    expect(results).toEqual([1, 2, 3]);
  });

  it('서로 다른 사용자의 작업은 독립적으로 실행된다', async () => {
    const results: number[] = [];
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    await Promise.all([
      lockManager.withLock(1, async () => {
        await delay(30);
        results.push(1);
      }),
      lockManager.withLock(2, async () => {
        results.push(2);
      })
    ]);

    // 사용자 2의 작업이 사용자 1의 작업이 끝나기 전에 완료되어야 함
    expect(results).toEqual([2, 1]);
  });
  
  it('여려 요청 속에서 같은 사용자 ID의 작업 순서는 보장한다', async () => {
    const lockManager = new LockManager();
    const results: string[] = [];
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
    const task = async (userId: number, taskId: string, delayTime: number) => {
      await lockManager.withLock(userId, async () => {
        await delay(delayTime);
        results.push(`${userId}-${taskId}`);
      });
    };
  
    await Promise.all([
      task(1, 'A', 50),
      task(2, 'B', 10),
      task(1, 'C', 20),
      task(3, 'D', 30),
      task(2, 'E', 5),
      task(1, 'F', 10),
      task(3, 'G', 5),
    ]);
  
    console.log(`results: ${results}`);
    expect(results.filter(r => r.startsWith('1-'))).toEqual(['1-A', '1-C', '1-F']);
    expect(results.filter(r => r.startsWith('2-'))).toEqual(['2-B', '2-E']);
    expect(results.filter(r => r.startsWith('3-'))).toEqual(['3-D', '3-G']);
  });

  // 메모리 정리 테스트 (메모리 누수 방지)
  it('동시에 여러 작업을 실행할 때 작업 수와 queues의 길이가 일치한다', async () => {
    let results: number
    await lockManager.withLock(1, async () => {
      await lockManager.withLock(2, async () => {
        await lockManager.withLock(3, async () => {
          results = lockManager.getQueuesSize();
        });
      });
    });
    expect(results).toEqual(3);
  });

  it('여러 사용자의 작업이 끝난 후 queues의 크기는 0이다', async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    await Promise.all([
      lockManager.withLock(1, async () => await delay(30)),
      lockManager.withLock(2, async () => await delay(20)),
      lockManager.withLock(3, async () => await delay(10)),
    ]);

    expect(lockManager.getQueuesSize()).toBe(0);
  });

});
