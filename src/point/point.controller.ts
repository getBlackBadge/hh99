import { Body, Controller, Get, Param, Patch, ValidationPipe, BadRequestException, NotFoundException, Injectable } from "@nestjs/common";
import { PointHistory, UserPoint } from "./point.model";
import { PointBodyDto, UserPointResponseDto, PointHistoryResponseDto } from "./point.dto";
import { PointService } from "./point.service";
import { UserManager } from '../common/user/user-manager';
import { UserPointTable } from '../database/userpoint.table';

@Controller('/point')
@Injectable()
export class PointController {
    private userManager: UserManager;

    constructor(
        private readonly pointService: PointService,
        private readonly userDb: UserPointTable
    ) {
        this.userManager = new UserManager(this.userDb);
    }

    @Get(':id')
    async point(@Param('id') id: string): Promise<UserPointResponseDto> {
        try {
            const userId = this.userManager.validateUserId(id);
            const userPoint = await this.pointService.getPoint(userId);
            return userPoint as UserPointResponseDto;
        } catch (error) {
            throw new NotFoundException(error.message);
        }
    }

    @Get(':id/histories')
    async history(@Param('id') id: string): Promise<PointHistoryResponseDto[]>  {
        try {
            const userId = this.userManager.validateUserId(id);
            const histories = await this.pointService.getHistories(userId);
            return histories as PointHistoryResponseDto[]
        } catch (error) {
            throw new NotFoundException(error.message);
        }
    }

    @Patch(':id/charge')
    async charge(
        @Param('id') id: string,
        @Body(ValidationPipe) PointBodyDto: PointBodyDto,
    ): Promise<UserPointResponseDto> {
        try {
            const userId = this.userManager.validateUserId(id);
            const userPoint = await this.pointService.charge(userId, PointBodyDto);
            return userPoint as UserPointResponseDto;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Patch(':id/use')
    async use(
        @Param('id') id: string,
        @Body(ValidationPipe) PointBodyDto: PointBodyDto,
    ): Promise<UserPointResponseDto> {
        try {
            const userId = this.userManager.validateUserId(id);
            const userPoint = await this.pointService.use(userId, PointBodyDto);
            return userPoint as UserPointResponseDto;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}