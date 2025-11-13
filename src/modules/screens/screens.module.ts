import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScreensController } from './controllers/screens.controller';
import { ScreensService } from './services/screens.service';
import { ScreensRepository } from './repositories/screens.repository';
import { TheatersModule } from '../theaters/theaters.module';
import { ScreenOrmEntity } from '../../shared/schemas/screen.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScreenOrmEntity]), forwardRef(() => TheatersModule)],
  controllers: [ScreensController],
  providers: [ScreensService, ScreensRepository],
  exports: [ScreensService, ScreensRepository],
})
export class ScreensModule {}



