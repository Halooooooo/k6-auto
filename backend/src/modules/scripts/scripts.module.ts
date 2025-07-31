import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScriptsController } from './scripts.controller';
import { ScriptsService } from './scripts.service';
import { ScriptVersionController } from './script-version.controller';
import { ScriptVersionService } from './script-version.service';
import { Script } from './entities/script.entity';
import { ScriptVersion } from './entities/script-version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Script, ScriptVersion])],
  controllers: [ScriptsController, ScriptVersionController],
  providers: [ScriptsService, ScriptVersionService],
  exports: [ScriptsService, ScriptVersionService],
})
export class ScriptsModule {}