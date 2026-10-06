import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database.module.js";
import { HealthController } from "./health.controller.js";
import { AuthModule } from "./auth/auth.module.js";
import { TenancyModule } from "./tenancy/tenancy.module.js";
@Module({
  imports: [DatabaseModule, AuthModule, TenancyModule],
  controllers: [HealthController],
})
export class AppModule {}
