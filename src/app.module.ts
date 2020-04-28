import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModel } from './auth/auth.model'
import { ApiModel } from './api/api.model'
import { HandlebarsAdapter, MailerModule } from '@nest-modules/mailer';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    AuthModel,
    ApiModel,
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: '34.87.25.3',
        port: 3306,
        username: 'root',
        password: 'utician1234',
        database: 'Utician'
      })
    }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'testdeveloperarvin@gmail.com',
          pass: 'Papli%4115!Test1234!'
        }
      }
    }),
    MulterModule.register({
      dest: './public',
    }),
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
  constructor(private readonly connection: Connection) { }
}
