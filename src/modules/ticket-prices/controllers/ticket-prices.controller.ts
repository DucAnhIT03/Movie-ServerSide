import { Controller, Get, Post, Body, Query, UseGuards, Param, ParseIntPipe, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TicketPricesService } from '../services/ticket-prices.service';
import { CreateTicketPriceDto } from '../dtos/request/create-ticket-price.dto';
import { TicketPriceResponseDto } from '../dtos/response/ticket-prices.response.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { QueryTicketPriceDto } from '../dtos/request/query-ticket-price.dto';
import { UpdateTicketPriceDto } from '../dtos/request/update-ticket-price.dto';

@ApiTags('🎫 Vé')
@Controller('ticket-prices')
export class TicketPricesController {
  constructor(private readonly ticketPricesService: TicketPricesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Lấy giá vé',
    description: 'Lấy giá vé dựa trên loại ghế, loại phim, ngày và giờ'
  })
  @ApiQuery({ name: 'typeSeat', description: 'Loại ghế (STANDARD, VIP, SWEETBOX)', example: 'STANDARD' })
  @ApiQuery({ name: 'typeMovie', description: 'Loại phim (2D, 3D, IMAX)', example: '2D' })
  @ApiQuery({ name: 'date', description: 'Ngày chiếu (YYYY-MM-DD)', example: '2023-12-15' })
  @ApiQuery({ name: 'time', required: false, description: 'Giờ chiếu (HH:MM)', example: '19:00' })
  @ApiQuery({ name: 'theaterId', required: false, description: 'ID rạp áp dụng giá vé', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Giá vé',
    schema: {
      type: 'object',
      properties: {
        price: { type: 'number', example: 150000, description: 'Giá vé (VND)' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy giá vé phù hợp' })
  async getPrice(
    @Query('typeSeat') typeSeat: string,
    @Query('typeMovie') typeMovie: string,
    @Query('date') date: string,
    @Query('time') time: string,
    @Query('theaterId') theaterId?: string,
  ) {
    return this.ticketPricesService.getPrice(
      typeSeat,
      typeMovie,
      new Date(date),
      time,
      theaterId ? Number(theaterId) : undefined,
    );
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Tạo giá vé mới - Chỉ admin',
    description: 'Thêm một mức giá vé mới vào hệ thống'
  })
  @ApiBody({ 
    description: 'Thông tin giá vé mới',
    type: CreateTicketPriceDto
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Giá vé đã được tạo thành công',
    type: TicketPriceResponseDto
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async create(@Body() dto: CreateTicketPriceDto) {
    const ticketPrice = await this.ticketPricesService.create(dto);
    return TicketPriceResponseDto.fromEntity(ticketPrice);
  }

  @Get('manage')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Danh sách giá vé (quản trị) với phân trang' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'STANDARD' })
  async list(@Query() query: QueryTicketPriceDto) {
    const result = await this.ticketPricesService.list(query);
    return {
      ...result,
      items: result.items.map(TicketPriceResponseDto.fromEntity),
    };
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Chi tiết giá vé - quản trị' })
  @ApiParam({ name: 'id', description: 'ID giá vé' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const ticketPrice = await this.ticketPricesService.findById(id);
    return TicketPriceResponseDto.fromEntity(ticketPrice);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Cập nhật giá vé - quản trị' })
  @ApiParam({ name: 'id', description: 'ID giá vé' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketPriceDto,
  ) {
    const ticketPrice = await this.ticketPricesService.update(id, dto);
    return TicketPriceResponseDto.fromEntity(ticketPrice);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Xóa giá vé - quản trị' })
  @ApiParam({ name: 'id', description: 'ID giá vé' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.ticketPricesService.remove(id);
    return { success: true };
  }
}
