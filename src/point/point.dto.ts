import { IsInt, IsPositive } from "class-validator";
import { TransactionType } from "./point.model";

export class PointBodyDto {
    @IsInt()
    @IsPositive()
    amount: number
}

export class PointDto {
    @IsInt()
    @IsPositive()
    amount: number
}

export class UserPointResponseDto {
    id: number
    point: number
    updateMillis: number
}

export class PointHistoryResponseDto {
    id: number
    userId: number
    type: TransactionType
    amount: number
    timeMillis: number
}