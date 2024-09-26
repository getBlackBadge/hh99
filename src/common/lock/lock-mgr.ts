import { Injectable } from '@nestjs/common';
import { Queue } from '../queue/queue';

@Injectable()
export class LockManager {
    private queues: Map<number, Queue<() => Promise<void>>> = new Map();
    private processing: Set<number> = new Set();

    async withLock<T>(userId: number, operation: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.getQueue(userId).enqueue(async () => {
                try {
                    const result = await operation();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.processNextInQueue(userId);
                }
            });

            if (!this.processing.has(userId)) {
                this.processNextInQueue(userId);
            }
        });
    }

    private getQueue(userId: number): Queue<() => Promise<void>> {
        if (!this.queues.has(userId)) {
            this.queues.set(userId, new Queue<() => Promise<void>>());
        }

        return this.queues.get(userId)!;
    }

    public getQueuesSize(): number {
        return this.queues.size;
    }

    private async processNextInQueue(userId: number): Promise<void> {
        const queue = this.getQueue(userId);
        if (queue.isEmpty()) {
            this.cleanupMemory(userId);
            return;
        }

        this.processing.add(userId);
        
        const nextOperation = queue.dequeue();
        if (nextOperation) {
            await nextOperation();
        }
    }

    // 메모리 정리
    private cleanupMemory(userId: number): void {
        this.queues.delete(userId);
        this.processing.delete(userId);
    }

}