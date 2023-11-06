export class CreatedResponseDto {
  status: boolean;

  statusCode: number;
}

export class OkResponseDto {
  status: boolean;

  statusCode: number;
}

export class BadRequestResponseDto {
  status: boolean;

  statusCode: number;

  timestamp: Date;
}

export class NotFoundResponseDto {
  status: boolean;

  statusCode: number;

  timestamp: Date;
}

export class ServerErrorResponseDto {
  status: boolean;

  statusCode: number;

  timestamp: Date;
}
