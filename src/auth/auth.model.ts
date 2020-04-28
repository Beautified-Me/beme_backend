import { Module, Global } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from './strategy/jwt.strategy'

@Global()
@Module({
    imports: [
        JwtModule.register({
                secret: 'you dont know javascript',
                signOptions: {expiresIn: '10h'}
        }),
        PassportModule.register({
            defaultStrategy: 'bearer',
            property: 'tenant'
        })
    ],
    controllers: [
        AuthController
    ],
    providers: [
        JwtStrategy
    ],
    exports: [

    ]
})

export class AuthModel {}
