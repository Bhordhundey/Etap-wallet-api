import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaDBService } from '../../helpers/client/prisma.db.client';
import { UpdatePinDto } from './dto/user.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaDBService,
    private authSerice: AuthService,
  ) {}

  async getUser(query: Record<string, any>, showPassword = false) {
    const user = await this.prismaService.user.findUnique({
      where: { ...query },
      include: { wallets: true, transactions: true },
    });
    if (!user) throw new NotFoundException('User does not exist');
    if (!showPassword) delete user.password;
    return user;
  }

  async updatePin(user_id: string, dto: UpdatePinDto) {
    const { id, password } = await this.getUser(
      {
        id: user_id,
      },
      true,
    );

    const pwMatch = await this.authSerice.comparePassword(
      password,
      dto.password,
    );

    if (!pwMatch) throw new ForbiddenException('Password is incorrect.');

    const pin = await this.authSerice.hashPassword(dto.pin);
    await this.prismaService.user.update({
      where: { id },
      data: { transaction_pin: pin },
    });

    return {
      message: 'PIN updated successfully',
      data: '',
    };
  }
}
