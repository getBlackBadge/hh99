import { IsInt } from "class-validator";
import { TransactionType } from "./point.model";

export class PointBodyDto {
    @IsInt()
    amount: number
}

export class PointDto {
    @IsInt()
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