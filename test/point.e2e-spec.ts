import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PointModule } from '../src/point/point.module';
import { UserManager } from '../src/common/user/user-mgr';
import { PointManager } from '../src/common/point/point-mgr';
import { PointService } from '../src/point/service/point.service';
import { RequestValidityError } from '../src/common/exceptions/validity-error';
import { PointNotEnoughError, PointExceededError } from '../src/common/exceptions/point-error';

describe('PointController (e2e)', () => {
  let app: INestApplication;
  let pointService = {
    getPoint: jest.fn(),
    getHistories: jest.fn(),
    charge: jest.fn(),
    use: jest.fn(),
  };

  let userManager = {
    validateUserId: jest.fn(),
  };

  let pointManager = {
    validateAmount: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PointModule],
    })
      .overrideProvider(PointService)
      .useValue(pointService)
      .overrideProvider(UserManager)
      .useValue(userManager)
      .overrideProvider(PointManager)
      .useValue(pointManager)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/point/:id (GET)', () => {
    it('사용자의 포인트를 반환해야 한다', () => {
      const mockUserPoint = { id: '1', point: 100 };
      userManager.validateUserId.mockReturnValue('1');
      pointService.getPoint.mockResolvedValue(mockUserPoint);

      return request(app.getHttpServer())
        .get('/point/1')
        .expect(200)
        .expect(mockUserPoint);
    });

    it('RequestValidityError 발생 시 400을 반환해야 한다', () => {
      userManager.validateUserId.mockImplementation(() => {
        throw new RequestValidityError('유효하지 않은 사용자 ID');
      });

      return request(app.getHttpServer())
        .get('/point/invalid-id')
        .expect(400)
        .expect({ statusCode: 400, message: '유효하지 않은 사용자 ID', error: 'Bad Request' });
    });

    it('내부 서버 오류 시 500을 반환해야 한다', () => {
      userManager.validateUserId.mockReturnValue('1');
      pointService.getPoint.mockImplementation(() => {
        throw new Error();
      });

      return request(app.getHttpServer())
        .get('/point/1')
        .expect(500)
        .expect({
          statusCode: 500,
          message: 'An error occurred while fetching user point',
          error: 'Internal Server Error',
        });
    });
  });

  describe('/point/:id/histories (GET)', () => {
    it('사용자의 포인트 내역을 반환해야 한다', () => {
      const mockHistories = [{ id: '1', amount: 100, type: 'charge' }];
      userManager.validateUserId.mockReturnValue('1');
      pointService.getHistories.mockResolvedValue(mockHistories);

      return request(app.getHttpServer())
        .get('/point/1/histories')
        .expect(200)
        .expect(mockHistories);
    });

    it('RequestValidityError 발생 시 400을 반환해야 한다', () => {
      userManager.validateUserId.mockImplementation(() => {
        throw new RequestValidityError('유효하지 않은 사용자 ID');
      });

      return request(app.getHttpServer())
        .get('/point/invalid-id/histories')
        .expect(400)
        .expect({ statusCode: 400, message: '유효하지 않은 사용자 ID', error: 'Bad Request' });
    });

    it('내부 서버 오류 시 500을 반환해야 한다', () => {
      userManager.validateUserId.mockReturnValue('1');
      pointService.getHistories.mockImplementation(() => {
        throw new Error();
      });

      return request(app.getHttpServer())
        .get('/point/1/histories')
        .expect(500)
        .expect({
          statusCode: 500,
          message: 'An error occurred while fetching point histories',
          error: 'Internal Server Error',
        });
    });
  });

  describe('/point/:id/charge (PATCH)', () => {
    it('사용자의 포인트를 충전해야 한다', () => {
      const mockUserPoint = { id: '1', point: 200 };
      userManager.validateUserId.mockReturnValue('1');
      pointManager.validateAmount.mockReturnValue(true);
      pointService.charge.mockResolvedValue(mockUserPoint);

      return request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 100 })
        .expect(200)
        .expect(mockUserPoint);
    });

    it('PointExceededError 발생 시 403을 반환해야 한다', () => {
      userManager.validateUserId.mockReturnValue('1');
      pointManager.validateAmount.mockImplementation(() => {
        throw new PointExceededError('포인트 초과');
      });

      return request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 100 })
        .expect(403)
        .expect({ statusCode: 403, message: '포인트 초과', error: 'Forbidden' });
    });

    it('내부 서버 오류 시 500을 반환해야 한다', () => {
      userManager.validateUserId.mockReturnValue('1');
      pointManager.validateAmount.mockReturnValue(true);
      pointService.charge.mockImplementation(() => {
        throw new Error();
      });

      return request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 100 })
        .expect(500)
        .expect({
          statusCode: 500,
          message: 'An error occurred while charging points',
          error: 'Internal Server Error',
        });
    });
  });

  describe('/point/:id/use (PATCH)', () => {
    it('사용자의 포인트를 사용해야 한다', () => {
      const mockUserPoint = { id: '1', point: 50 };
      userManager.validateUserId.mockReturnValue('1');
      pointManager.validateAmount.mockReturnValue(true);
      pointService.use.mockResolvedValue(mockUserPoint);

      return request(app.getHttpServer())
        .patch('/point/1/use')
        .send({ amount: 50 })
        .expect(200)
        .expect(mockUserPoint);
    });

    it('PointNotEnoughError 발생 시 403을 반환해야 한다', () => {
      userManager.validateUserId.mockReturnValue('1');
      pointManager.validateAmount.mockImplementation(() => {
        throw new PointNotEnoughError('포인트 부족');
      });

      return request(app.getHttpServer())
        .patch('/point/1/use')
        .send({ amount: 100 })
        .expect(403)
        .expect({ statusCode: 403, message: '포인트 부족', error: 'Forbidden' });
    });

    it('내부 서버 오류 시 500을 반환해야 한다', () => {
      userManager.validateUserId.mockReturnValue('1');
      pointManager.validateAmount.mockReturnValue(true);
      pointService.use.mockImplementation(() => {
        throw new Error();
      });

      return request(app.getHttpServer())
        .patch('/point/1/use')
        .send({ amount: 50 })
        .expect(500)
        .expect({
          statusCode: 500,
          message: 'An error occurred while using points',
          error: 'Internal Server Error',
        });
    });
  });
});
