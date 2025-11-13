import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { DataConsistencyService } from '../services/data-consistency.service';
import { DashboardStatsResponseDto } from '../dtos/response/dashboard-stats.response.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('jwt')
@UseGuards(AdminGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dataConsistencyService: DataConsistencyService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê tổng quan cho dashboard - Chỉ admin' })
  @ApiOkResponse({ description: 'Thống kê tổng quan', type: DashboardStatsResponseDto })
  async getStats(): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getStats();
  }

  @Get('consistency')
  @ApiOperation({ summary: 'Kiểm tra tính nhất quán dữ liệu trong database - Chỉ admin' })
  @ApiOkResponse({ description: 'Kết quả kiểm tra tính nhất quán dữ liệu' })
  async checkConsistency() {
    return this.dataConsistencyService.checkConsistency();
  }
}



