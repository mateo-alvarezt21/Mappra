import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private supabase;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
    );
  }

  async login(loginDto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error || !data.user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: data.user.id, email: data.user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role ?? 'user',
      },
    };
  }
}
