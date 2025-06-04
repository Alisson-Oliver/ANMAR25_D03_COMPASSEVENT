import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/users.service';
import { PatchUserDto } from '../users/dto/patch-user.dto';
import { access } from 'fs';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly JWTService: JwtService,
    private readonly userService: UserService,
  ) {}

  createLoginToken(user: any) {
    return {
      accessToken: this.JWTService.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        {
          expiresIn: '7d',
          algorithm: 'HS256',
          audience: 'users',
        },
      ),
    };
  }

  checkToken(token: string) {
    try {
      const decoded = this.JWTService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      return decoded;
    } catch (error) {
      Logger.error('Invalid token', error);
      throw new BadRequestException('Invalid token');
    }
  }

  async login(email: string, password: string) {
    const user = await this.userService.emailExists(email);

    if (!user) {
      throw new BadRequestException('invalid email or password');
    }
    if (user.deletedAt) {
      throw new BadRequestException('user account is deleted');
    }
    if (!user.emailVerified) {
      throw new BadRequestException('email not verified');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('invalid email or password');
    }

    return this.createLoginToken(user);
  }
}
