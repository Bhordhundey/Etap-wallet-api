import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePinDto {
  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(4)
  pin: string;
}
