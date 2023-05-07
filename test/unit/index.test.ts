import request from 'supertest';
import { describe, expect, test } from '@jest/globals';
import { app } from '../../src/routes/routes';

test('app module should be defined', () => {
    expect(app).toBeDefined();
});

test('GET / should return 200', () => {
    return request(app)
        .get('/')
        .expect(200);
});