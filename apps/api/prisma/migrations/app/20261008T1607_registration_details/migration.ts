#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/82246644d6b576cf506aea3eefa57dfdec083d8129109431f5275eedcc0ad192/contract';
import startContract from '../../snapshots/82246644d6b576cf506aea3eefa57dfdec083d8129109431f5275eedcc0ad192/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d41737e8db8b006b2f29f11b079d232f80e83a2c62ec80174990e0366ad0b6cb/contract';
import endContract from '../../snapshots/d41737e8db8b006b2f29f11b079d232f80e83a2c62ec80174990e0366ad0b6cb/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'organizations',
        column: col('employeeCount', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'organizations',
        column: col('website', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'users',
        column: col('firstName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'users',
        column: col('lastName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'users',
        column: col('middleName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'users',
        column: col('phoneNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
