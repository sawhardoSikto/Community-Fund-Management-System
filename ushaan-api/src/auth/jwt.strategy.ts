import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Header theke "Bearer eyJ..." ber kore
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // secret key diye token verify kore
      secretOrKey: configService.get('JWT_SECRET') as string,
    });
  }

  // token valid hole ei function call hobe, payload parameter e token er data thakbe
  // ja return korbe seta request.user e set hobe
 async validate(payload: any) {
  //console.log('JWT Payload:', payload);
  return { 
    id: payload.id,       
    email: payload.email, 
    role: payload.role 
  };
}
}