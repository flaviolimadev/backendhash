import { IsUUID, IsNumber, IsIn } from 'class-validator';

export class CreateSaqueDto {
  @IsUUID()
  profile_id: string;

  @IsNumber()
  value: number;

  @IsIn([1, 2])
  type: number;

  @IsUUID()
  wallet_id: string;
}
