import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SupabaseModule } from '../supabase/supabase.module'; // <- IMPORTAR AQUI!

@Module({
  imports: [SupabaseModule], // <- OBRIGATÓRIO
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
