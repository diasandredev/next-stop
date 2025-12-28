import { describe, it, expect } from 'vitest';
import { loadEnv } from 'vite';

describe('Environment Variables', () => {
    it('should be loadable via loadEnv', () => {
        const env = loadEnv('development', process.cwd(), '');
        console.log('Explicitly Loaded Env:', env);
        console.log('VITE_FIREBASE_API_KEY from explicit load:', env.VITE_FIREBASE_API_KEY);
        expect(env.VITE_FIREBASE_API_KEY).toBeDefined();
    });
});
