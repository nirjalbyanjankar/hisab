import { Transform } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ROLES, type Role } from "@hisab/permissions";

const normalize = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;
export class LoginDto {
  @ApiProperty({ example: "my-company" })
  @Transform(normalize)
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  organizationSlug!: string;

  @ApiProperty({ example: "owner@example.com" })
  @Transform(normalize)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 1, maxLength: 128, writeOnly: true })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
export class SignupDto extends LoginDto {
  @ApiProperty({ example: "My Company" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/\S/)
  organizationName!: string;

  @ApiProperty({ example: "Nirjal" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/\S/)
  fullName!: string;

  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true })
  @MinLength(12)
  declare password: string;
}
export class CreateMemberDto {
  @ApiProperty({ example: "colleague@example.com" })
  @Transform(normalize)
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/\S/)
  fullName!: string;
  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
  @ApiProperty({ enum: ROLES.filter((role) => role !== "OWNER") })
  @IsIn(ROLES.filter((role) => role !== "OWNER"))
  role!: Role;
}
