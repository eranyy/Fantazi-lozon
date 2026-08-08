import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout } from '../geminiService';

describe('fetchWithTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should resolve if promise resolves before timeout', async () => {
        const promise = new Promise((resolve) => {
            setTimeout(() => resolve('success'), 100);
        });

        const resultPromise = fetchWithTimeout(promise, 500);
        vi.advanceTimersByTime(100);

        await expect(resultPromise).resolves.toBe('success');
    });

    it('should reject if promise rejects before timeout', async () => {
        const promise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('failure')), 100);
        });

        const resultPromise = fetchWithTimeout(promise, 500);
        vi.advanceTimersByTime(100);

        await expect(resultPromise).rejects.toThrow('failure');
    });

    it('should throw timeout error if promise takes longer than timeout', async () => {
        const promise = new Promise((resolve) => {
            setTimeout(() => resolve('success'), 1000);
        });

        const resultPromise = fetchWithTimeout(promise, 500);
        vi.advanceTimersByTime(500);

        await expect(resultPromise).rejects.toThrow('Timeout: The request took longer than 0.5 seconds');
    });
});
