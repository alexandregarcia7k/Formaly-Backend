import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('forms')
@Controller('api/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Criar novo formulário' })
  @ApiResponse({
    status: 201,
    description: 'Formulário criado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas' })
  async create(@Body() dto: CreateFormDto, @CurrentUser() user: User) {
    return this.formsService.create(dto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar formulários do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de formulários',
  })
  async findAll(@CurrentUser() user: User, @Query() query: FindAllQueryDto) {
    return this.formsService.findAll(user.id, query);
  }

  @Get(':id/submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar respostas do formulário' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de respostas',
  })
  @ApiResponse({
    status: 404,
    description: 'Formulário não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão',
  })
  async getSubmissions(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    const validPage = Math.max(Number(page) || 1, 1);
    const validPageSize = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
    return this.formsService.getSubmissions(
      id,
      user.id,
      validPage,
      validPageSize,
    );
  }

  @Post(':id/clone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Clonar formulário' })
  @ApiResponse({
    status: 201,
    description: 'Formulário clonado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Formulário não encontrado',
  })
  @ApiResponse({ status: 429, description: 'Muitas tentativas' })
  async clone(@Param('id') id: string, @CurrentUser() user: User) {
    return this.formsService.clone(id, user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar formulário por ID' })
  @ApiResponse({
    status: 200,
    description: 'Formulário encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Formulário não encontrado',
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.formsService.findOne(id, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar formulário' })
  @ApiResponse({
    status: 200,
    description: 'Formulário atualizado',
  })
  @ApiResponse({
    status: 404,
    description: 'Formulário não encontrado',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFormDto,
    @CurrentUser() user: User,
  ) {
    return this.formsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar formulário' })
  @ApiResponse({
    status: 204,
    description: 'Formulário deletado',
  })
  @ApiResponse({
    status: 404,
    description: 'Formulário não encontrado',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.formsService.remove(id, user.id);
  }
}
