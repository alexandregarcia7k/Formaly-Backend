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
} from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { User } from '@prisma/client';
import { FIELD_TYPES_METADATA } from '@/common/types/field-types.type';

@ApiTags('forms')
@Controller('api/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get('field-types')
  @Public()
  @ApiOperation({ summary: 'Listar tipos de campos disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos de campos',
  })
  getFieldTypes() {
    return Object.values(FIELD_TYPES_METADATA);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo formulário' })
  @ApiResponse({
    status: 201,
    description: 'Formulário criado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
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
  async findAll(@CurrentUser() user: User, @Query('page') page = 1) {
    return this.formsService.findAll(user.id, Number(page));
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
  @ApiOperation({ summary: 'Deletar formulário (soft delete)' })
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
  @ApiOperation({ summary: 'Clonar formulário' })
  @ApiResponse({
    status: 201,
    description: 'Formulário clonado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Formulário não encontrado',
  })
  async clone(@Param('id') id: string, @CurrentUser() user: User) {
    return this.formsService.clone(id, user.id);
  }
}
