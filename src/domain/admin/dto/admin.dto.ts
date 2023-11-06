import { IsNotEmpty, IsString } from 'class-validator';

export class PendingApprovalIdDto {
  @IsString()
  @IsNotEmpty()
  pending_aproval_id: string;
}

export class IdDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
