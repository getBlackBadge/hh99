import { Test, TestingModule } from '@nestjs/testing';
import { UserManager } from './user-mgr';
import { UserPointTable } from '../../database/userpoint.table';
import { RequestValidityError } from '../exceptions/validity-error';
describe('UserManager', () => {
  let userManager: UserManager;
  let userPointTableMock: jest.Mocked<UserPointTable>;

  beforeEach(async () => {
    userPointTableMock = {
      selectById: jest.fn(),
      insertOrUpdate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManager,
        {
          provide: UserPointTable,
          useValue: userPointTableMock,
        },
      ],
    }).compile();

    userManager = module.get<UserManager>(UserManager);
  });

  describe('validateUserId', () => {
    it('유효한 문자열이 주어지면 숫자를 반환해야 함', () => {
      expect(userManager.validateUserId('123')).toBe(123);
    });

    it('문자열이 주어지면 유효하지 않기 때문에 에러를 던져야 함', () => {
      expect(() => userManager.validateUserId('abc')).toThrow(new RequestValidityError('Invalid user ID'));
    });
  });
});