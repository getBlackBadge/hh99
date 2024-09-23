import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from '../point.controller';
import { PointService } from '../point.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserPoint, PointHistory, TransactionType } from '../point.model';

describe('PointController', () => {
  let controller: PointController;
  let pointServiceMock: jest.Mocked<PointService>;

  beforeEach(async () => {
    pointServiceMock = {
      getPoint: jest.fn(),
      getHistories: jest.fn(),
      charge: jest.fn(),
      use: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [
        {
          provide: PointService,
          useValue: pointServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PointController>(PointController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('point', () => {
    it('should return user point', async () => {
      const mockPoint: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
      pointServiceMock.getPoint.mockResolvedValue(mockPoint);

      const result = await controller.point('1');
      expect(result).toEqual(mockPoint);
    });

    it('should throw NotFoundException when user not found', async () => {
      pointServiceMock.getPoint.mockRejectedValue(new Error('User not found'));

      await expect(controller.point('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.point('invalid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('history', () => {
    it('should return point histories', async () => {
      const mockHistories: PointHistory[] = [{id: 1, userId: 1, amount: 100, type: TransactionType.CHARGE, timeMillis: Date.now() }];
      pointServiceMock.getHistories.mockResolvedValue(mockHistories);

      const result = await controller.history('1');
      expect(result).toEqual(mockHistories);
    });

    it('should throw NotFoundException when user not found', async () => {
      pointServiceMock.getHistories.mockRejectedValue(new Error('User not found'));

      await expect(controller.history('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('charge', () => {
    it('should charge points successfully', async () => {
      const mockPoint: UserPoint = { id: 1, point: 200, updateMillis: Date.now() };
      pointServiceMock.charge.mockResolvedValue(mockPoint);

      const result = await controller.charge('1', { amount: 100 });
      expect(result).toEqual(mockPoint);
    });

    it('should throw BadRequestException for invalid charge', async () => {
      pointServiceMock.charge.mockRejectedValue(new Error('Invalid charge'));

      await expect(controller.charge('1', { amount: -100 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('use', () => {
    it('should use points successfully', async () => {
      const mockPoint: UserPoint = { id: 1, point: 50, updateMillis: Date.now() };
      pointServiceMock.use.mockResolvedValue(mockPoint);

      const result = await controller.use('1', { amount: 50 });
      expect(result).toEqual(mockPoint);
    });

    it('should throw BadRequestException for invalid use', async () => {
      pointServiceMock.use.mockRejectedValue(new Error('Insufficient points'));

      await expect(controller.use('1', { amount: 1000 })).rejects.toThrow(BadRequestException);
    });
  });
});