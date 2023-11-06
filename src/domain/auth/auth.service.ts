import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaDBService } from '../../helpers/client/prisma.db.client';
import { AccountLoginDto, CreateAccountDto } from './dto/user.dto';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { User } from '@prisma/client';
import config from '../../config';

const scryptAsync = promisify(scrypt);

@Injectable()
export class AuthService {
  constructor(
    private jwtSerice: JwtService,
    private prismaService: PrismaDBService,
  ) {}

  async createUser(data: CreateAccountDto) {
    //convert email to lowercase
    data.email = data.email.toLowerCase();
    const { email, phone, password } = data;
    const hashedPassword = await this.hashPassword(password);

    await this.verifyUniqueCredential({
      email,
      phone,
    });

    const user = await this.prismaService.user.create({
      data: {
        ...data,
        password: hashedPassword,
        is_verified: true,
      },
    });
    if (!user)
      throw new BadRequestException(
        'Failed to create account, please try again',
      );

    delete user.password;

    const returnedUser = this.filterUserData(user);

    return {
      message: 'Account created successfully',
      data: returnedUser,
    };
  }

  async login(data: AccountLoginDto) {
    const { phone, password } = data;
    const user = await this.prismaService.user.findFirst({
      where: {
        phone,
      },
    });

    if (!user) throw new ForbiddenException('User does not exist');

    // Compare Password
    const isPasswordMatch = await this.comparePassword(user.password, password);
    console.log('==isPasswordMatch===', isPasswordMatch);
    if (!isPasswordMatch) throw new ForbiddenException('Invalid Password.');

    // Sign token
    const access_token = await this.signToken(user.id);

    const returnedUser = this.filterUserData(user);
    return {
      message: 'Login successful',
      data: {
        user: returnedUser,
        access_token,
      },
    };
  }

  async hashPassword(Char: string) {
    const salt = randomBytes(8).toString('hex');
    const buf = (await scryptAsync(Char, salt, 64)) as Buffer;

    return `${buf.toString('hex')}.${salt}`;
  }

  async comparePassword(storedChar: string, suppliedChar: string) {
    const [hashedChar, salt] = storedChar.split('.');
    const buf = (await scryptAsync(suppliedChar, salt, 64)) as Buffer;

    return buf.toString('hex') === hashedChar;
  }

  private async signToken(user_id: string): Promise<string> {
    return this.jwtSerice.signAsync(
      { user_id },
      {
        expiresIn: config().jwt.expiresIn,
        secret: config().jwt.secret,
      },
    );
  }

  private filterUserData(user: User) {
    //return very limited user details
    return {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }

  private async verifyUniqueCredential({ email, phone }) {
    const phoneExist = await this.prismaService.user.findFirst({
      where: { phone: phone },
    });

    if (phoneExist)
      throw new BadRequestException('Account with this phone already exists');

    const emailExist = await this.prismaService.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (emailExist)
      throw new BadRequestException('Account with this email already exists');
  }
}
