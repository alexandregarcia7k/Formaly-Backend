import { Controller, Get, Post, Body, Param, Req, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicFormsService } from './public-forms.service';
import { ValidatePasswordDto } from './dto/validate-password.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { Public } from '@/common/decorators/public.decorator';
import type { FastifyRequest } from 'fastify';

@ApiTags('public-forms')
@Controller('f')
@Public()
export class PublicFormsController {
  constructor(private readonly publicFormsService: PublicFormsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Visualizar formulário público' })
  @ApiResponse({ status: 200, description: 'Formulário encontrado' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Formulário inativo/expirado/cheio',
  })
  async getForm(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @Ip() ip: string,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.publicFormsService.getPublicForm(id, userAgent, ip);
  }

  @Post(':id/validate-password')
  @ApiOperation({ summary: 'Validar senha do formulário' })
  @ApiResponse({ status: 200, description: 'Senha válida' })
  @ApiResponse({ status: 401, description: 'Senha inválida' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas' })
  async validatePassword(
    @Param('id') id: string,
    @Body() dto: ValidatePasswordDto,
  ) {
    const valid = await this.publicFormsService.validatePassword(
      id,
      dto.password,
    );
    return { valid };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Enviar resposta do formulário' })
  @ApiResponse({ status: 201, description: 'Resposta enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Senha obrigatória/inválida' })
  @ApiResponse({
    status: 409,
    description: 'Múltiplas submissões não permitidas',
  })
  @ApiResponse({ status: 429, description: 'Muitas tentativas' })
  async submitResponse(
    @Param('id') id: string,
    @Body() dto: SubmitResponseDto,
    @Req() req: FastifyRequest,
    @Ip() ip: string,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.publicFormsService.submitResponse(id, dto, userAgent, ip);
  }
}
