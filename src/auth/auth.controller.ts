import { Body, Controller, Get, HttpException, NotFoundException, Param, Post, UnauthorizedException, Query, Req, UseGuards } from '@nestjs/common'
import { Connection, QueryRunner } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import * as nodemailer from 'nodemailer'
import { AuthGuard } from '@nestjs/passport'
import { MailerService, ISendMailOptions } from '@nest-modules/mailer';

@Controller('auth')
export class AuthController {

    constructor(
        public connection: Connection,
        public jwt: JwtService,
        public mailerService: MailerService
    ) { }

    @Post('login')
    async login(
        @Body() body
    ) {
        const query = this.connection.createQueryRunner()
        await query.connect()
        const auth = await query.query(`SELECT id as auth_id,password,userName,email,account_activated from auth where userName = '${body.userName}'`)
        if (auth.length > 0) {

            // Check password
            if (!bcrypt.compareSync(body.password, auth[0].password)) {
                await query.release()
                throw new UnauthorizedException({ message: 'Invalid Password' })
            }
            delete auth[0]['password']

            console.log(auth[0].account_activated)
            // Check account activated
            if (auth[0].account_activated == 0) {
                await query.release()
                throw new UnauthorizedException({ message: 'Account Not activated. Please activate your account.' })
            }

            const user = await query.query(`SELECT id as user_id from users where auth_id = '${auth[0].auth_id}'`)
            let data = { ...auth[0], ...user[0] }
            let payloads = this.getSignToken(data)
            await query.release()
            Object.assign(payloads, { userName: auth[0].userName, email: auth[0].email })
            return payloads
        } else {
            await query.release()
            throw new HttpException({ message: 'User not found' }, 202)
        }
    }

    @Get('version')
    async version() {
        return 'v1.0'
    }

    getSignToken(payload) {
        const expiresInMins = 60 * 10 // expires in 5 hours
        const expiresInTime = new Date().getTime() + (expiresInMins * 60 * 1000)
        const access_token = this.jwt.sign(payload) // { expiresInMinutes: expiresInMins }

        return {
            access_token,
            expiresInTime
        }
    }

    @Post('register')
    async userRegistration(
        @Body() body
    ) {
        let userName = body.userName
        let userEmail = body.userEmail
        let password = body.password

        console.log("connect")
        const query = this.connection.createQueryRunner()
        await query.connect()
        
        console.log("conencted")
        //Check If Username and passsword is empty
        if(userName == null || userName == ''){
            await query.release()
            throw new HttpException({ message: 'Username cannot be empty.' }, 403)
        }

        if(userEmail == null || userEmail == ''){
            await query.release()
            throw new HttpException({ message: 'User Email cannot be empty.' }, 403)
        }

        if(password == null || password == ''){
            await query.release()
            throw new HttpException({ message: 'User Password cannot be empty.' }, 403)
        }

        console.log("executing query")
        // Check Email Exist
        const checkEmailValidity = await query.query(`SELECT * from auth where email= '${userEmail}'`)

        console.log("exit sql")
        if (checkEmailValidity.length > 0) {
            await query.release()
            throw new HttpException({ message: 'This email has already been registered.' }, 403)
        }

        // Check Username exist
        const checkUserNameValidity = await query.query(`SELECT * from auth where userName= '${userName}'`)

        if (checkUserNameValidity.length > 0) {
            await query.release()
            throw new HttpException({ message: 'This username has already been taken.' }, 403)
        }

        const randomInt = Math.random().toString(13).replace('0.', '')
        let encryptPassword = await bcrypt.hash(password, 3)



        try {
            let result = await query.query(`INSERT INTO auth(userName,email,password,email_activate_id) VALUES('${userName}', '${userEmail}', '${encryptPassword}','${randomInt}')`)

            const urlApi = `http://35.240.205.140:3000/auth/activate?id=${result['insertId']}&activateId=${randomInt}`

            const message = {
                from: 'testdeveloperarvin@gmail.com', // Sender address
                to: userEmail,         // List of recipients
                subject: 'BeMe Activation', // Subject line
                text: `Please click the link below to activate!/n 
                ${urlApi}` // Plain text body
            };

            if (result['affectedRows'] == 1) {
                await query.query(`INSERT INTO users(auth_id) VALUES('${result['insertId']}')`)
                // this.initNodeMailer(message)
                try{
                this.mailerService.sendMail({
                    from: 'testdeveloperarvin@gmail.com', // Sender address
                    to: userEmail,         // List of recipients
                    subject: 'BeMe Activation', // Subject line
                    text: `Please click the link below to activate!/n 
                    ${urlApi}` // Plain text body
                }).then(data => {
                    console.log(data)
                }).catch(error => {
                    console.log(error)
                })
            } catch(err){
                console.log(err)
            }  
            }
            // await query.release()
            return {
                message: "Please check your email for account activation",
                success: true
            }
        } catch (err) {
            console.log(err)
            // await query.release()
            throw new HttpException({ message: 'Registration Failed(403). Please contanct admin' }, 400)
        } finally {
            console.log("connection release")
            await query.release()
        }
    }

    initNodeMailer(message) {
        try{
        let transport = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: 'testdeveloperarvin@gmail.com',
                pass: 'Papli%4115!Test1234!'
            }
        });

        transport.sendMail(message, function (err, info) {
            if (err) {
                console.log("error")
                console.log(err)
                return
            } else {
                console.log("info")
                console.log(info);
            }
            transport.close();
        });

    } catch(error){
        console.log(error)
        throw new HttpException({ message: 'Internal Server Error' }, 500)
    }
    }

    @Get('activate')
    async userActivation(
        @Query() param
    ) {
        try{
        const auth_id = param.id
        const actCode = param.activateId

        const query = this.connection.createQueryRunner()
        await query.connect()

        let result = await query.query(`SELECT email_activate_id from auth where id=${auth_id}`)
        if (result.length > 0) {
            if (result[0].email_activate_id == actCode) {
                try {
                    await query.query(`UPDATE auth SET account_activated = 1 where id=${auth_id}`)
                    return {
                        message: 'Account activated. Please proceed to login',
                        success: true
                    }
                } catch (err) {
                    console.log(err)
                    await query.release()
                    throw new HttpException({ message: 'Activation failed. Please try again later' }, 400)
                } finally {
                    await query.release()
                }
            } else {
                await query.release()
                throw new HttpException({ message: 'Invalid Activation Code' }, 400)
            }
        } else {
            await query.release()
            throw new HttpException({ message: 'User not found. Please register first' }, 400)
        }} catch(error){
            console.log(error)
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('resetPassword')
    async userPasswordReset(
        @Body() body,
        @Req() req
    ) {
        try{
        let currentPass = body.currentPass
        let newPassword = body.newPassword
        let renewPassword = body.newPasswordAgain

        const query = this.connection.createQueryRunner()
        await query.connect()

        let result = await query.query(`select password from auth where id= ${req.state.auth_id}`)

        if (result.length > 0) {
            // Check password
            if (!bcrypt.compareSync(currentPass, result[0].password)) {
                await query.release()
                throw new UnauthorizedException({ message: 'Invalid Current Password' })
            }

            if (newPassword != renewPassword) {
                await query.release()
                throw new HttpException({ message: 'New passwords needs to match. Please retype again' }, 403)
            }

            try {
                let encryptPassword = await bcrypt.hash(newPassword, 3)
                await query.query(`update auth set password= '${encryptPassword}' where id=${req.state.auth_id}`)
                await query.release()
                return {
                    message: "Password successufuly reseted",
                    status: true
                }
            } catch (err) {
                console.log(err)
                await query.release()
                throw new HttpException({ message: 'Unable to reset password. Please try again' }, 403)
            } finally {
                await query.release()
            }
        }} catch(error){
            console.log(error)
        }
    }

    @Post('forgotPassword')
    async forgotPassword(
        @Body() body
    ) {
        let userName = body.userName
        let email = body.email

        const query = this.connection.createQueryRunner()
        await query.connect()

        let result = await query.query(`select userName, email, id from auth where email= '${email}'`)

        if (result.length > 0) {

            if (userName != result[0].userName) {
                await query.release()
                throw new HttpException({ message: 'username does not belongs to the email provided' }, 403)
            }

            const randomInt = Math.random().toString(13).replace('0.', '')
            let encryptPassword = await bcrypt.hash(randomInt, 3)


            try {
                let results = await query.query(`update auth set password='${encryptPassword}' where id=${result[0].id}`).then(data => {
                    console.log(data)
                })
                console.log("updated")
                await query.release()
                // const message = {
                //     from: 'testdeveloperarvin@gmail.com', // Sender address
                //     to: email,         // List of recipients
                //     subject: 'Password Reset', // Subject line
                //     text: `Please find below your reseted password.
                //     Be advice to change this temporary password.
                //     Temporary Password: ${randomInt}` // Plain text body
                // };

                // this.initNodeMailer(message)
                try{
                this.mailerService.sendMail({
                    from: 'testdeveloperarvin@gmail.com', // Sender address
                    to: email,         // List of recipients
                    subject: 'Password Reset', // Subject line
                    text: `Please find below your reseted password.
                    Be advice to change this temporary password.
                    Temporary Password: ${randomInt}` // Plain text body
                }).then(data => {
                    console.log(data)
                }).catch(error => {
                    console.log(error)
                })} catch (err) {
                    console.log(err)
                }
                
                return {
                    message: "Please check your email for temporary password",
                    success: true
                }
            } catch (err) {
                console.log(err)
                await query.release()
                throw new HttpException({ message: 'Password reset failed. Please contact admin' }, 400)
            }
        }else {
            await query.release()
        }
    }
}
