import { Role } from '@prisma/client';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsEmail,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  password: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class AccountLoginDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
