import { Body, Controller, Get, Param, Patch, ValidationPipe, BadRequestException, NotFoundException, Injectable } from "@nestjs/common";
import { PointHistory, UserPoint } from "./point.model";
import { PointBody as PointDto } from "./point.dto";
import { PointService } from "./point.service";
import { UserManager } from "./managers/user-manager";
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
    async point(@Param('id') id: string): Promise<UserPoint> {
        try {
            const userId = this.userManager.validateUserId(id);
            return await this.pointService.getPoint(userId);
        } catch (error) {
            throw new NotFoundException(error.message);
        }
    }

    @Get(':id/histories')
    async history(@Param('id') id: string): Promise<PointHistory[]> {
        try {
            const userId = this.userManager.validateUserId(id);
            return await this.pointService.getHistories(userId);
        } catch (error) {
            throw new NotFoundException(error.message);
        }
    }

    @Patch(':id/charge')
    async charge(
        @Param('id') id: string,
        @Body(ValidationPipe) pointDto: PointDto,
    ): Promise<UserPoint> {
        try {
            const userId = this.userManager.validateUserId(id);
            return await this.pointService.charge(userId, pointDto);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Patch(':id/use')
    async use(
        @Param('id') id: string,
        @Body(ValidationPipe) pointDto: PointDto,
    ): Promise<UserPoint> {
        try {
            const userId = this.userManager.validateUserId(id);
            return await this.pointService.use(userId, pointDto);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}