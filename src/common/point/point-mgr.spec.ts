import { PointManager } from './point-mgr';
import { UserPoint } from '../../point/point.model';
import { PointDto } from '../../point/point.dto';
import { randomInt } from 'crypto';
import { RequestValidityError } from '../exceptions/validity-error';
describe('PointManager', () => {
  let pointManager: PointManager;

  beforeEach(() => {
    pointManager = new PointManager();
    process.env.MAX_POINT_LIMIT = '10000000';
  });

  // validateCharge 메소드 테스트
  describe('validateCharge', () => {
    it('유효한 충전 금액을 검증해야 한다', () => {
      const validPointDto = { amount: 500 } as PointDto;
      expect(() => pointManager.validateCharge(validPointDto)).not.toThrow();
    });

    it('음수 충전 금액에 대해 에러를 발생시켜야 한다', () => {
      const invalidPointDto = { amount: -100 } as PointDto;
      expect(() => pointManager.validateCharge(invalidPointDto)).toThrow(new RequestValidityError(PointManager.getErrorMessage('NEGATIVE_AMOUNT')));
    });
  });

  // validateUse 메소드 테스트
  describe('validateUse', () => {
    const user: UserPoint = { point: 1000 } as UserPoint;

    it('유효한 사용 금액을 검증해야 한다', () => {
      const validPointDto = { amount: 500 } as PointDto;
      expect(() => pointManager.validateUse(user, validPointDto)).not.toThrow();
    });

    it('음수 사용 금액에 대해 에러를 발생시켜야 한다', () => {
      const invalidPointDto = { amount: -100 } as PointDto;
      expect(() => pointManager.validateUse(user, invalidPointDto)).toThrow(new RequestValidityError(PointManager.getErrorMessage('NEGATIVE_AMOUNT')));
    });

    it('사용자의 포인트보다 큰 금액에 대해 에러를 발생시켜야 한다', () => {
      const exceedingPointDto = { amount: 1500 } as PointDto;
      expect(() => pointManager.validateUse(user, exceedingPointDto)).toThrow(PointManager.getErrorMessage('INSUFFICIENT_POINTS'));
    });
  });
  
  // charge 메소드 테스트
  describe('charge', () => {
    it('사용자의 포인트를 올바르게 증가시켜야 한다', () => {
        const user: UserPoint = { point: 1000, updateMillis: 0 } as UserPoint;
        pointManager.add(user, 500);
        expect(user.point).toBe(1500);
        expect(user.updateMillis).toBeGreaterThan(0);
      });
    });
    it('최대 포인트 보유량을 초과하는 포인트 충전에 대해 에러를 발생시켜야 한다', () => {
      const maxPoint = parseInt(process.env.MAX_POINT_LIMIT || '10000000');
      const user: UserPoint = { point: maxPoint, updateMillis: 0 } as UserPoint;
      expect(() => pointManager.add(user, randomInt(1,500))).toThrow(PointManager.getErrorMessage('EXCEEDS_POINT_LIMIT'));
    });
      
  // use 메소드 테스트
  describe('use', () => {
    it('사용자의 포인트를 올바르게 감소시켜야 한다', () => {
      const user: UserPoint = { point: 1000, updateMillis: 0 } as UserPoint;
      pointManager.use(user, 300);
      expect(user.point).toBe(700);
      expect(user.updateMillis).toBeGreaterThan(0);
    });
  });
});