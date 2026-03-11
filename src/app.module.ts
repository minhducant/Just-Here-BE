import { Logger, Module } from '@nestjs/common';
import Modules from 'src/modules';

@Module({
  controllers: [],
  imports: [...Modules],
  providers: [Logger],
})
export class AppModules {}
