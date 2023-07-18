import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request: Request = httpContext.getRequest();

    const method = request.method;
    const url = request.url;

    console.log(`Before... [${method} ${url}]`);

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() =>
          console.log(`After... [${method} ${url}] ${Date.now() - now}ms`),
        ),
      );
  }
}
