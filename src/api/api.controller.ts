import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Connection } from 'typeorm'
import { AuthGuard } from '@nestjs/passport';
import { imageFileFilter, editFileName } from './file.upload.util'
import { diskStorage } from 'multer'
import { join } from 'path'

@UseGuards(AuthGuard('jwt'))
@Controller('api')
export class ApiController {

    public baseURL = "http://localhost:3000/"
    public imageDestinationPath = join(__dirname, '../public')

    constructor(
        public connection: Connection
    ) { }

    @Get('colour')
    async colour_code() {
        const query = this.connection.createQueryRunner()
        await query.connect()
        try {
            const result = await query.query('SELECT * FROM colour_code')
            // query.release()
            return result
        } catch (error) {
            console.log(error)
        } finally {
            console.log("releasing query")
            await query.release()
        }
    }

    @Get('product')
    async product() {
        const query = this.connection.createQueryRunner()
        await query.connect()
        try {
            const result = await query.query('SELECT * FROM product')
            // query.release()
            return result
        } catch (error) {
            console.log(error)
        } finally {
            console.log("releasing query")
            await query.release()
        }
    }

    @Get('productType')
    async productType() {
        const query = this.connection.createQueryRunner()
        await query.connect()
        try {

            const result = await query.query('SELECT * FROM product_type')
            // query.release()
            return result
        } catch (error) {
            console.log(error)
        } finally {
            console.log("releasing query")
            await query.release()
        }

    }

    @Get('productMakers')
    async productMakers() {
        const query = this.connection.createQueryRunner()
        await query.connect()
        try {

            const result = await query.query('SELECT * FROM product_makers')
            // query.release()
            return result
        } catch (error) {
            console.log(error)
        } finally {
            console.log("releasing query")
            await query.release()
        }
    }

    @Get('user')
    async userDetails(
        @Param() param,
        @Req() request
    ) {
        const query = this.connection.createQueryRunner()
        await query.connect()
        try {

            const result = await query.query(`SELECT gender,age,phoneNo,address1,address2,name,profile_picture FROM users where id = '${request.state.user_id}' `)
            // query.release()
            return result
        } catch (error) {
            console.log(error)
        } finally {
            console.log("releasing query")
            await query.release()
        }
    }

    @Get('productSearch')
    async productSearch(
        @Query() query
    ) {
        const query_sql = this.connection.createQueryRunner()
        await query_sql.connect()
        try {
            let product_type = query.productTypeId
            let checkProduct_type = false
            let product_makers = query.productMakersId
            let checkProduct_makers = false
            let colour_code = query.colourCodeId
            let checckColour_code = false




            let left_join = ''
            let sql_statement_where = ''
            let select_field = 'p.name,p.description,p.image,p.price'


            left_join = `left join product_type pt on p.product_type = pt.id `
            select_field = select_field + ',pt.name as product_type_name'

            left_join = left_join + `left join product_makers pm on p.product_makers = pm.id `
            select_field = select_field + ',pm.name as product_makers_name'

            left_join = left_join + `left join colour_code cc on p.colour_id = cc.id`
            select_field = select_field + ',cc.colour_name,cc.colour_hex_code'

            if (product_type) {
                sql_statement_where = `p.product_type = '${product_type}' `
                checkProduct_type = true
            }

            if (product_makers) {
                if (checkProduct_type) {
                    sql_statement_where = sql_statement_where + `and `
                }
                sql_statement_where = sql_statement_where + `p.product_makers = '${product_makers}' `
                checkProduct_makers = true
            }

            if (colour_code) {
                if (checkProduct_makers || checkProduct_type) {
                    sql_statement_where = sql_statement_where + `and `
                }
                sql_statement_where = sql_statement_where + `p.colour_id = '${colour_code}' `
            }

            let sql_statement = `SELECT ${select_field} from product p ${left_join} where ${sql_statement_where}`

            const result = await query_sql.query(sql_statement)
            // query_sql.release()
            return result
        } catch (error) {
            console.log(error)
        } finally {
            console.log("releasing query")
            await query_sql.release()
        }
    }

    @Get('productSearchByObject')
    async productSearchByObject(
        @Body() body
    ) {
        const query_sql = this.connection.createQueryRunner()
        await query_sql.connect()
        try {


            let data = body
            let left_join = ''
            // let sql_statement_where = ''
            let select_field = 'p.name,p.description,p.image,p.price'


            left_join = `left join product_type pt on p.product_type = pt.id `
            select_field = select_field + ',pt.name as product_type_name'

            left_join = left_join + `left join product_makers pm on p.product_makers = pm.id `
            select_field = select_field + ',pm.name as product_makers_name'

            left_join = left_join + `left join colour_code cc on p.colour_id = cc.id`
            select_field = select_field + ',cc.colour_name,cc.colour_hex_code'


            for (let x of data) {
                let sql_statement
                if (x.hasOwnProperty('colour_code')) {
                    sql_statement = `SELECT ${select_field} from product p ${left_join} where pt.id = '${x.product_type}' and cc.colour_hex_code = '${x.colour_code}'`
                } else {
                    sql_statement = `SELECT ${select_field} from product p ${left_join} where pt.id = '${x.product_type}' and cc.id = '${x.colour_id}'`
                }
                console.log(sql_statement)
                let result = await query_sql.query(sql_statement)
                x['result'] = result
            }

            // query_sql.release()
            return data
        } catch (error) {
            console.log(error)
        } finally {
            console.log("releasing query")
            await query_sql.release()
        }
    }

    @Post('user')
    async userUpdateDetails(
        @Param() param,
        @Req() request,
        @Res() res
    ) {
        const query = this.connection.createQueryRunner()
        await query.connect()
        try {
            // var address = request.body.address
            var gender = request.body.gender
            var age = request.body.age
            var phoneNo = request.body.phoneNo
            var address1 = request.body.address1
            var address2 = request.body.address2
            var name = request.body.name
            var email = request.body.email
            const result = await query.query(`update users,auth set users.address1=?, users.address2=?, users.gender=?, users.age=?, users.name=?, users.phoneNo=?, auth.email=? where users.auth_id = auth.id and users.id = '${request.state.user_id}'`, [address1, address2, gender, age, name, phoneNo, email])
            res.status(200).send({ "message": "Excuted", "status": "success", "queryStatus": result })
            return
        } catch (error) {
            console.log(error)
        } finally {
            console.log("releasing query")
            await query.release()
        }
    }

    @Post('profilePicture')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './public',
                filename: editFileName,
            }),
            fileFilter: imageFileFilter,
            limits : {
                fileSize: 10 * 1024 * 1024,
            }
        }),
    )
    async userProfilePicture(
        @Param() param,
        @Req() request,
        @Res() res,
        @UploadedFile() file
    ) {
        const query = this.connection.createQueryRunner()
        await query.connect()
        try {
            let fileName = this.baseURL + file.filename
            const result = await query.query(`update users set profile_picture=? where id = '${request.state.user_id}'`, [fileName])
            res.status(200).send({ "message": "Image Uploaded", "status": "success", "queryStatus": result })
            return
        } catch (error) {
            console.log(error)
        } finally {
            console.log("releasing query")
            await query.release()
        }
    }
}