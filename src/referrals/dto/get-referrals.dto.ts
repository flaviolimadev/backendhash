import { IsUUID } from 'class-validator';

export class GetReferralsDto {
  @IsUUID()
  profile_id: string;
}
