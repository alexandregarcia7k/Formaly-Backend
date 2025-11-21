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
  @Throttle({ medium: { limit: 10, ttl: 60000 } }) // 10 criações por minuto
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
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'searchIn',
    required: false,
    enum: ['form', 'responses', 'all'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'all'],
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'name', 'totalResponses'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Lista de formulários',
  })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 15,
    @Query('search') search?: string,
    @Query('searchIn') searchIn: 'form' | 'responses' | 'all' = 'form',
    @Query('status') status: 'active' | 'inactive' | 'all' = 'all',
    @Query('sortBy')
    sortBy: 'createdAt' | 'updatedAt' | 'name' | 'totalResponses' = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return this.formsService.findAll(user.id, {
      page: Number(page),
      pageSize: Number(pageSize),
      search,
      searchIn,
      status,
      sortBy,
      sortOrder,
    });
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

  @Post(':id/clone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ medium: { limit: 5, ttl: 60000 } }) // 5 clones por minuto
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
}
