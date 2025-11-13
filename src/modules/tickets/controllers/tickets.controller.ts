import { Controller, Get, Param, Patch, Post, Put, Delete, Body, Query, UseGuards, ParseIntPipe, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from '../services/tickets.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';

@ApiTags('🎫 Vé')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('user/:userId')
  @ApiOperation({ 
    summary: 'Lấy danh sách vé của người dùng',
    description: 'Lấy tất cả vé đã đặt của một người dùng cụ thể'
  })
  @ApiParam({ name: 'userId', type: Number, description: 'ID người dùng' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách vé của người dùng',
    schema: {
      type: 'array',
      example: [
        {
          id: 1,
          userId: 1,
          showtimeId: 5,
          totalSeat: 2,
          totalPriceMovie: 300000,
          created_at: '2025-01-15T10:00:00.000Z',
          showtime: {
            id: 5,
            startTime: '2025-01-20T18:00:00.000Z',
            endTime: '2025-01-20T20:30:00.000Z'
          },
          bookingSeats: [
            { seatId: 10, quantity: 1 },
            { seatId: 11, quantity: 1 }
          ]
        }
      ]
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  getUserTickets(@Param('userId') userId: number) {
    return this.ticketsService.getUserTickets(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Lấy tất cả vé (Admin)',
    description: 'Lấy danh sách tất cả vé trong hệ thống với phân trang và tìm kiếm (chỉ admin)'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (bắt đầu từ 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng mỗi trang (tối thiểu 1, tối đa 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo ID vé, email user, tên phim' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách vé đã phân trang',
    schema: {
      example: {
        items: [
          {
            id: 1,
            userId: 1,
            showtimeId: 5,
            totalSeat: 2,
            totalPriceMovie: 300000,
            created_at: '2025-01-15T10:00:00.000Z'
          }
        ],
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  getAllTickets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.ticketsService.getAllTickets({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Lấy thông tin chi tiết vé',
    description: 'Lấy thông tin chi tiết của một vé theo ID'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID vé' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thông tin chi tiết vé',
    schema: {
      example: {
        id: 1,
        userId: 1,
        showtimeId: 5,
        totalSeat: 2,
        totalPriceMovie: 300000,
        created_at: '2025-01-15T10:00:00.000Z',
        user: {
          id: 1,
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'user@example.com'
        },
        showtime: {
          id: 5,
          startTime: '2025-01-20T18:00:00.000Z',
          endTime: '2025-01-20T20:30:00.000Z',
          movieId: 10
        },
        bookingSeats: [
          { id: 1, seatId: 10, quantity: 1 },
          { id: 2, seatId: 11, quantity: 1 }
        ],
        payments: []
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy vé' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  getTicketById(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.getTicketById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Tạo vé (Admin)',
    description: 'Admin tạo một vé mới thay cho người dùng chỉ định'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1, description: 'ID người dùng được tạo vé' },
        showtimeId: { type: 'number', example: 5, description: 'ID suất chiếu' },
        seatIds: { 
          type: 'array', 
          items: { type: 'number' },
          example: [10, 11],
          description: 'Danh sách ID ghế'
        },
        totalPriceMovie: { type: 'number', example: 300000, description: 'Tổng giá vé' }
      },
      required: ['userId', 'showtimeId', 'seatIds', 'totalPriceMovie']
    }
  })
  @ApiResponse({ status: 201, description: 'Tạo vé thành công' })
  createTicket(@Req() req: any, @Body() body: any) {
    return this.ticketsService.createTicket(body.userId, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Cập nhật vé',
    description: 'Cập nhật thông tin vé (chỉ chủ vé). Không thể cập nhật nếu đã thanh toán hoặc suất chiếu đã bắt đầu.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID vé' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        seatIds: { 
          type: 'array', 
          items: { type: 'number' },
          example: [10, 11, 12],
          description: 'Danh sách ID ghế mới (tùy chọn)'
        },
        totalPriceMovie: { type: 'number', example: 450000, description: 'Tổng giá vé mới (tùy chọn)' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật vé thành công',
    schema: {
      example: {
        id: 1,
        userId: 1,
        showtimeId: 5,
        totalSeat: 3,
        totalPriceMovie: 450000,
        created_at: '2025-01-15T10:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc không thể cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy vé' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  updateTicket(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const user = req.user as any;
    const userId = user?.id ?? user?.sub;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return this.ticketsService.updateTicket(id, userId, body);
  }

  @Patch('cancel/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Hủy vé',
    description: 'Hủy một vé đã đặt. Không thể hủy nếu đã thanh toán thành công hoặc suất chiếu đã bắt đầu.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID vé đặt' })
  @ApiResponse({ 
    status: 200, 
    description: 'Hủy vé thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Booking cancelled' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Không thể hủy vé (đã thanh toán hoặc suất chiếu đã bắt đầu)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy vé' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  cancelTicket(@Req() req: Request, @Param('id') bookingId: number) {
    const user = req.user as any;
    const userId = user?.id ?? user?.sub;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return this.ticketsService.cancelTicket(bookingId, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Xóa vé',
    description: 'Xóa một vé khỏi hệ thống (chỉ chủ vé hoặc admin, chỉ khi chưa thanh toán)'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID vé cần xóa' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa vé thành công',
    schema: {
      example: {
        message: 'Xóa vé thành công'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Không thể xóa vé (đã thanh toán)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy vé' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa vé' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  deleteTicket(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as any;
    const userId = user?.id ?? user?.sub;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    // TODO: Kiểm tra isAdmin từ req.user
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const isAdmin = roles.some((role: any) => {
      if (typeof role === 'string') {
        return role === 'ROLE_ADMIN';
      }
      if (role && typeof role === 'object') {
        return role.roleName === 'ROLE_ADMIN' || role.name === 'ROLE_ADMIN';
      }
      return false;
    });
    return this.ticketsService.deleteTicket(id, userId, isAdmin);
  }
}
