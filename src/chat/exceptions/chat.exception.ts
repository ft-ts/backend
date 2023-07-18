import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

export class MissingPasswordException extends BadRequestException {
  constructor() {
    super('Password is required for a PROTECTED channel.');
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class NotAuthorizedException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}