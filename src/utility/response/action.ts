import { HttpCode, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class HttpResponse {
  @HttpCode(HttpStatus.CREATED)
  createdResponse(data: any, message: string) {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message,
      data,
    };
  }

  okResponse(message: string, data?: any) {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message,
      data,
    };
  }
}
