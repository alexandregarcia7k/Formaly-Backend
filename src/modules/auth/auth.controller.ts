import { Controller, Post, Get, Body, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { SyncUserDto } from './dto/sync-user.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @Public()
  @ApiOperation({
    summary: 'Sincronizar usuário OAuth',
    description: 'Cria ou atualiza usuário e account após OAuth callback',
  })
  @ApiResponse({ status: 200, description: 'Usuário sincronizado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async syncUser(
    @Body() dto: SyncUserDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.syncUser(dto);
    this.setCookie(reply, result.accessToken);
    return { user: result.user };
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.register(dto);
    this.setCookie(reply, result.accessToken);
    return { user: result.user };
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login com email/senha' })
  @ApiResponse({ status: 200, description: 'Login realizado' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.login(dto);
    this.setCookie(reply, result.accessToken);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout (limpa cookie)' })
  @ApiResponse({ status: 200, description: 'Logout realizado' })
  async logout(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logout realizado com sucesso' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Usuário autenticado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getMe(@CurrentUser() user: User) {
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  private setCookie(reply: FastifyReply, token: string): void {
    reply.setCookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
