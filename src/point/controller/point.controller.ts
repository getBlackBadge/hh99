import { Body, Controller, Get, Param, Patch, ValidationPipe, BadRequestException, ForbiddenException, NotFoundException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PointBodyDto, UserPointResponseDto, PointHistoryResponseDto } from "../point.dto";
import { PointService } from "../service/point.service";
import { UserManager } from '../../common/user/user-mgr';
import { PointManager } from '../../common/point/point-mgr';
import { RequestValidityError } from '../../common/exceptions/validity-error';
import { PointNotEnoughError, PointExceededError } from '../../common/exceptions/point-error';
@Controller('/point')
@Injectable()
export class PointController {
    constructor(
        private readonly pointService: PointService,
        private readonly userManager: UserManager,
        private readonly pointManager: PointManager,
    ) {}
    
    @Get(':id')
    async point(@Param('id') id: string): Promise<UserPointResponseDto> {
        try {
            const userId = this.userManager.validateUserId(id);
            const userPoint = await this.pointService.getPoint(userId);
            return userPoint as UserPointResponseDto;
        } catch (error) {
            // if (error instanceof NotFoundException) {
            //     throw error;
            //     can't be here
            // }
            if (error instanceof RequestValidityError) {
                throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException('An error occurred while fetching user point');
        }
    }

    @Get(':id/histories')
    async history(@Param('id') id: string): Promise<PointHistoryResponseDto[]>  {
        try {
            const userId = this.userManager.validateUserId(id);
            const histories = await this.pointService.getHistories(userId);
            return histories as PointHistoryResponseDto[]
        } catch (error) {
            if (error instanceof RequestValidityError) {
                throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException('An error occurred while fetching point histories');
        }
    }

    @Patch(':id/charge')
    async charge(
        @Param('id') id: string,
        @Body(ValidationPipe) PointBodyDto: PointBodyDto,
    ): Promise<UserPointResponseDto> {
        try {
            const userId = this.userManager.validateUserId(id);
            this.pointManager.validateAmount(PointBodyDto.amount);
            const userPoint = await this.pointService.charge(userId, PointBodyDto);
            return userPoint as UserPointResponseDto;
        } catch (error) {
            if (error instanceof RequestValidityError) {
                throw new BadRequestException(error.message);
            }
            if (error instanceof RequestValidityError) {
                throw new BadRequestException(error.message);
            }
            if (error instanceof PointExceededError) {
                throw new ForbiddenException(error.message);
            }
            throw new InternalServerErrorException('An error occurred while charging points');
        }
    }

    @Patch(':id/use')
    async use(
        @Param('id') id: string,
        @Body(ValidationPipe) PointBodyDto: PointBodyDto,
    ): Promise<UserPointResponseDto> {
        try {
            const userId = this.userManager.validateUserId(id);
            this.pointManager.validateAmount(PointBodyDto.amount);
            const userPoint = await this.pointService.use(userId, PointBodyDto);
            return userPoint as UserPointResponseDto;
        } catch (error) {
            if (error instanceof RequestValidityError) {
                throw new BadRequestException(error.message);
            }
            if (error instanceof RequestValidityError) {
                throw new BadRequestException(error.message);
            }
            if (error instanceof PointNotEnoughError) {
                throw new ForbiddenException(error.message);
            }
            throw new InternalServerErrorException('An error occurred while using points');
        }
    }
}