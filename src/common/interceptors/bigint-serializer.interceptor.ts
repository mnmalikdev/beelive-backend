import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * BigInt Serializer Interceptor
 * 
 * WHY: JavaScript's JSON.stringify doesn't support BigInt by default.
 * Drizzle ORM returns BigInt for MySQL bigint columns. This interceptor
 * converts BigInt values to strings before JSON serialization, ensuring
 * API responses work correctly. Production-ready solution for BigInt handling.
 */
@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.transformBigInt(data)),
    );
  }

  private transformBigInt(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'bigint') {
      return data.toString();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.transformBigInt(item));
    }

    if (typeof data === 'object') {
      const transformed: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          transformed[key] = this.transformBigInt(data[key]);
        }
      }
      return transformed;
    }

    return data;
  }
}

