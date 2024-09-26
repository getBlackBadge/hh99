import { Queue } from './queue';

describe('Queue', () => {
  let queue: Queue<number>;

  beforeEach(() => {
    queue = new Queue<number>();
  });

  test('enqueue는 큐에 항목을 추가한다', () => {
    queue.enqueue(1);
    expect(queue.isEmpty()).toBe(false);
  });

  test('dequeue는 첫 번째 항목을 제거하고 반환해야 함', () => {
    queue.enqueue(1);
    queue.enqueue(2);
    expect(queue.dequeue()).toBe(1);
    expect(queue.dequeue()).toBe(2);
  });

  test('dequeue는 큐가 비어있으면 undefined를 반환해야 함', () => {
    expect(queue.dequeue()).toBeUndefined();
  });

  test('isEmpty는 빈 큐에 대해 true를 반환해야 함', () => {
    expect(queue.isEmpty()).toBe(true);
  });

  test('isEmpty는 비어있지 않은 큐에 대해 false를 반환해야 함', () => {
    queue.enqueue(1);
    expect(queue.isEmpty()).toBe(false);
  });

  test('clear는 큐를 비워야 함', () => {
    queue.enqueue(1);
    queue.enqueue(2);
    queue.clear();
    expect(queue.isEmpty()).toBe(true);
  });

  test('size는 큐의 크기를 반환해야 함', () => {
    expect(queue.size()).toBe(0);
    queue.enqueue(1);
    expect(queue.size()).toBe(1);
    queue.enqueue(2);
    expect(queue.size()).toBe(2);
    queue.dequeue();
    expect(queue.size()).toBe(1);
  });
});