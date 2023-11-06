import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from '../decorator/get-role.decorator';
import { PrismaDBService } from '../../../helpers/client/prisma.db.client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prismaService: PrismaDBService,
    private jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    let user = request.user;

    if (!user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, token] = request.headers.authorization.split(' ');
      user = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    }

    user = await this.prismaService.user.findUnique({
      where: {
        id: user['user_id'],
      },
    });

    if (roles.some((role) => user.role === role)) {
      return true;
    } else {
      return false;
    }
  }
}
