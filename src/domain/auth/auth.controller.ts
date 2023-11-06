import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { HttpResponse } from '../../utility/response';
import { ApiTags } from '@nestjs/swagger';
import { AccountLoginDto, CreateAccountDto } from './dto/user.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private response: HttpResponse,
  ) {}

  // Sign up
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: CreateAccountDto) {
    const { message, data } = await this.authService.createUser(dto);
    return this.response.createdResponse(data, message);
  }

  // Signin
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() dto: AccountLoginDto) {
    const { message, data } = await this.authService.login(dto);

    return this.response.okResponse(message, data);
  }
}
