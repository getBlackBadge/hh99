import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PointModule } from '../point.module';

describe('PointController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PointModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/point/:id (GET)', async () => {
    // 먼저 포인트를 충전합니다
    await request(app.getHttpServer())
      .patch('/point/1/charge')
      .send({ amount: 100 })
      .expect(200);

    // 그 다음 포인트를 조회합니다
    const response = await request(app.getHttpServer())
      .get('/point/1')
      .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('point', 100);
  });

  it('/point/:id/histories (GET)',  async () => {
    // 포인트 충전
    await request(app.getHttpServer())
      .patch('/point/1/charge')
      .send({ amount: 100 })
      .expect(200);

    // 포인트 사용
    await request(app.getHttpServer())
      .patch('/point/1/use')
      .send({ amount: 30 })
      .expect(200);

    // 포인트 사용 내역 조회
    const response = await request(app.getHttpServer())
      .get('/point/1/histories')
      .expect(200);

    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThanOrEqual(2);

    // 최근 두 개의 내역 확인
    const latestHistories = response.body.slice(-2);

    // 충전 내역 확인
    expect(latestHistories[0]).toMatchObject({
      userId: 1,
      amount: 100,
      type: 0
    });

    // 사용 내역 확인
    expect(latestHistories[1]).toMatchObject({
      userId: 1,
      amount: 30,
      type: 1
    });
  });

  it('/point/:id/charge (PATCH)', async () => {
    const response = await request(app.getHttpServer())
      .patch('/point/1/charge')
      .send({ amount: 200 })
      .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body.point).toBe(370);
  });

  it('/point/:id/use (PATCH)', async () => {
    const response = await request(app.getHttpServer())
        .patch('/point/1/use')
        .send({ amount: 50 })
        .expect(200);

    expect(response.body).toHaveProperty('id', 1);
    expect(response.body.point).toBe(320);
  });

});