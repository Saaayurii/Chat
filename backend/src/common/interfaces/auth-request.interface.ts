import { Request } from 'express';
import { User } from '../../database/schemas/user.schema';

export interface AuthenticatedRequest extends Request {
  user: User & { _id: string };
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}