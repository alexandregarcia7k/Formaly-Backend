import { Controller, Get, Post, Param, Body, Req, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicFormsService } from './public-forms.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { ValidatePasswordDto } from './dto/validate-password.dto';
import { Public } from '@/common/decorators/public.decorator';
import type { FastifyRequest } from 'fastify';

@ApiTags('public-forms')
@Controller('f')
@Public()
export class PublicFormsController {
  constructor(private readonly publicFormsService: PublicFormsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Visualizar formulário público' })
  @ApiResponse({
    status: 200,
    description: 'Formulário encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Formulário não encontrado',
  })
  async getForm(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @Ip() ip: string,
  ) {
    const userAgent = req.headers['user-agent'];
    await this.publicFormsService.trackView(id, ip, userAgent);
    return this.publicFormsService.getPublicForm(id);
  }

  @Post(':id/validate-password')
  @ApiOperation({ summary: 'Validar senha do formulário' })
  @ApiResponse({
    status: 200,
    description: 'Senha válida',
  })
  @ApiResponse({
    status: 401,
    description: 'Senha inválida',
  })
  async validatePassword(
    @Param('id') id: string,
    @Body() dto: ValidatePasswordDto,
  ) {
    const isValid = await this.publicFormsService.validatePassword(
      id,
      dto.password,
    );
    return { valid: isValid };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Enviar resposta do formulário' })
  @ApiResponse({
    status: 201,
    description: 'Resposta enviada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
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
