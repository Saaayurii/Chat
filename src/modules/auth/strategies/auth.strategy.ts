import { Injectable } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secretKey',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return await this.authService.validateUserById(payload.sub);
  }
}

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(req) => req.cookies.refreshToken]),
      ignoreExpiration: false,
      secretOrKey: 'refreshSecret',
    });
  }

  validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}