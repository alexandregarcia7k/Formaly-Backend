import { Controller, Post, Get, Body, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { SyncUserDto } from './dto/sync-user.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SuccessMessages } from '@/common/types/error-response.type';
import type { User } from '@prisma/client';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  private readonly COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  } as const;

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
  @Throttle({ 'auth-register': { limit: 3 } }) // 3 registros por minuto
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas' })
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
  @Throttle({ 'auth-login': { limit: 5 } }) // 5 tentativas por minuto
  @ApiOperation({ summary: 'Login com email/senha' })
  @ApiResponse({ status: 200, description: 'Login realizado' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas' })
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
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.clearCookie('accessToken', this.COOKIE_OPTIONS);
    return { message: SuccessMessages.LOGOUT_SUCCESS };
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Usuário autenticado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  getMe(@CurrentUser() user: User) {
    const { password: _password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(200)
  @Throttle({ 'auth-forgot': { limit: 3 } }) // 3 tentativas por hora
  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  @ApiResponse({ status: 200, description: 'Email enviado (se existir)' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Redefinir/Definir senha' })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido/expirado/usado' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  private setCookie(reply: FastifyReply, token: string): void {
    reply.setCookie('accessToken', token, {
      ...this.COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
