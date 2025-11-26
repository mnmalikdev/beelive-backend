import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { createConnection } from 'mysql2';
import * as schema from './schema';
import { DatabaseService } from './database.service';
import { DATABASE_CONNECTION } from './database.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const sslEnabled = configService.get<string>('DB_SSL', 'true') === 'true';
        
        const connectionConfig: any = {
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 3306),
          user: configService.get<string>('DB_USER', 'root'),
          password: configService.get<string>('DB_PASSWORD', ''),
          database: configService.get<string>('DB_NAME', 'beelive'),
        };

        // Enable SSL for Azure MySQL and other secure connections
        if (sslEnabled) {
          connectionConfig.ssl = {
            rejectUnauthorized: configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED', 'false') === 'true',
          };
        }

        const connection = createConnection(connectionConfig);

        return drizzle(connection, { schema, mode: 'default' });
      },
    },
    DatabaseService,
  ],
  exports: [DATABASE_CONNECTION, DatabaseService],
})
export class DatabaseModule {}

