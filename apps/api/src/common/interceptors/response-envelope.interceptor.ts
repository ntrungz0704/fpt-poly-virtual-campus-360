import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { ApiMeta, ApiSuccessEnvelope } from "@fpt-campus/shared";
import { map, type Observable } from "rxjs";
import type { RequestWithMeta } from "../middleware/request-id.middleware";

export interface PaginatedPayload<T> {
  __paginated: true;
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export function createPaginatedPayload<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedPayload<T> {
  return {
    __paginated: true,
    data,
    page,
    limit,
    total,
  };
}

function isPaginatedPayload(val: unknown): val is PaginatedPayload<unknown> {
  return (
    typeof val === "object" &&
    val !== null &&
    "__paginated" in val &&
    (val as { __paginated?: unknown }).__paginated === true
  );
}

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiSuccessEnvelope<unknown>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessEnvelope<unknown>> {
    const req = context.switchToHttp().getRequest<RequestWithMeta>();
    const requestId = req.requestId ?? "req_unknown";

    return next.handle().pipe(
      map((payload) => {
        const meta: ApiMeta = {
          requestId,
          timestamp: new Date().toISOString(),
        };

        if (isPaginatedPayload(payload)) {
          meta.page = payload.page;
          meta.limit = payload.limit;
          meta.total = payload.total;
          return {
            success: true,
            data: payload.data,
            meta,
          };
        }

        return {
          success: true,
          data: payload,
          meta,
        };
      }),
    );
  }
}
