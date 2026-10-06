import { Public } from "./auth/auth.decorators.js";
import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Database } from "./database/client.js";
import { DATABASE } from "./database.module.js";

@ApiTags("health")
@Controller("health")
@Public()
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Get()
  @ApiOperation({ summary: "Process liveness" })
  live() {
    return { status: "ok" };
  }

  @Get("ready")
  @ApiOperation({ summary: "Database readiness" })
  async ready() {
    try {
      await this.db.orm.public.Organization.select("id").limit(1).all();
      return { status: "ok", database: "up" };
    } catch {
      throw new ServiceUnavailableException("Database unavailable");
    }
  }
}
