import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { GetUser, JwtGuard } from 'src/utility/auth';
import { HttpResponse } from 'src/utility/response';
import { UpdatePinDto } from './dto/user.dto';

@Controller('user')
@UseGuards(JwtGuard)
export class UserController {
  constructor(
    private userService: UserService,
    private response: HttpResponse,
  ) {}

  //   @Get('profile')
  //   async getProfile(@GetUser() user_id: string) {
  //     const { message, data } = await this.userService.getProfile(user_id);
  //     return this.response.okResponse(message, data);
  //   }

  @Put('/profile/pin')
  async updatePin(@GetUser() user_id: string, @Body() dto: UpdatePinDto) {
    const { message } = await this.userService.updatePin(user_id, dto);
    return this.response.okResponse(message);
  }
}
