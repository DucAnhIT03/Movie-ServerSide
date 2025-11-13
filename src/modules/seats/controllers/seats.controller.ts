import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SeatsService } from '../services/seats.service';
import { Seat } from '../../../shared/schemas/seat.entity';
import { CreateSeatDto } from '../dtos/request/create-seat.dto';
import { UpdateSeatDto } from '../dtos/request/update-seat.dto';
import { SeatResponseDto } from '../dtos/response/seats.response.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';

@ApiTags('🪑 Ghế')
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Lấy danh sách tất cả ghế',
    description: 'Lấy danh sách tất cả ghế trong hệ thống'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách ghế',
    type: [SeatResponseDto]
  })
  async findAll(): Promise<SeatResponseDto[]> {
    const seats = await this.seatsService.findAll();
    return seats.map(seat => SeatResponseDto.fromEntity(seat));
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Tạo ghế mới - Chỉ admin',
    description: 'Tạo một ghế mới trong phòng chiếu'
  })
  @ApiBody({ 
    description: 'Thông tin ghế mới',
    type: CreateSeatDto
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Ghế đã được tạo thành công',
    type: SeatResponseDto
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async create(@Body() dto: CreateSeatDto): Promise<SeatResponseDto> {
    const seat = await this.seatsService.create(dto);
    return SeatResponseDto.fromEntity(seat);
  }

  @Get('showtime/:showtimeId')
  @ApiOperation({ 
    summary: 'Lấy danh sách ghế theo suất chiếu',
    description: 'Lấy danh sách ghế của phòng chiếu cho một suất chiếu cụ thể, bao gồm trạng thái đã đặt'
  })
  @ApiParam({ name: 'showtimeId', type: Number, description: 'ID suất chiếu' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách ghế với trạng thái đã đặt',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          seatNumber: { type: 'string' },
          seatType: { type: 'string' },
          price: { type: 'number' },
          screenId: { type: 'number' },
          isBooked: { type: 'boolean', description: 'Ghế đã được đặt chưa' }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy suất chiếu' })
  async findByShowtime(@Param('showtimeId', ParseIntPipe) showtimeId: number) {
    const seats = await this.seatsService.findByShowtime(showtimeId);
    return seats.map(seat => ({
      ...SeatResponseDto.fromEntity(seat),
      isBooked: (seat as any).isBooked,
    }));
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy thông tin chi tiết ghế',
    description: 'Lấy thông tin chi tiết của một ghế theo ID'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID ghế' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thông tin ghế',
    type: SeatResponseDto
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ghế' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SeatResponseDto> {
    const seat = await this.seatsService.findOne(id);
    return SeatResponseDto.fromEntity(seat);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Cập nhật thông tin ghế - Chỉ admin',
    description: 'Cập nhật thông tin của một ghế'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID ghế' })
  @ApiBody({ 
    description: 'Thông tin cập nhật ghế',
    type: UpdateSeatDto
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Ghế đã được cập nhật thành công',
    type: SeatResponseDto
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ghế' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSeatDto): Promise<SeatResponseDto> {
    const seat = await this.seatsService.update(id, dto);
    return SeatResponseDto.fromEntity(seat);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Xóa ghế - Chỉ admin',
    description: 'Xóa một ghế khỏi hệ thống'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID ghế' })
  @ApiResponse({ 
    status: 200, 
    description: 'Ghế đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Ghế đã được xóa thành công' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ghế' })
  @ApiResponse({ status: 400, description: 'Không thể xóa ghế đã được đặt' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.seatsService.remove(id);
  }
}
