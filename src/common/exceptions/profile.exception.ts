import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

export class DuplicateUserNameException extends HttpException {
    constructor(message: string) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
