import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  ALLOW_MUST_CHANGE_PASSWORD_KEY,
  IS_PUBLIC_KEY,
  type RequestWithAuth,
} from "../decorators/auth.decorators";

@Injectable()
export class ForcePasswordChangedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const allowMustChange = this.reflector.getAllAndOverride<boolean>(
      ALLOW_MUST_CHANGE_PASSWORD_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowMustChange) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    if (req.user?.mustChangePassword) {
      throw new ForbiddenException({
        code: "PASSWORD_CHANGE_REQUIRED",
        message:
          "Bạn bắt buộc phải đổi mật khẩu khởi tạo trước khi truy cập chức năng quản trị.",
      });
    }
    return true;
  }
}
