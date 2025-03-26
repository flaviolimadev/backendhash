import { Controller, Post, Body } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { GetReferralsDto } from './dto/get-referrals.dto';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  async getReferrals(@Body() dto: GetReferralsDto) {
    const referrals = await this.referralsService.getReferredProfiles(dto.profile_id);
    return { profile_id: dto.profile_id, referrals };
  }
}
