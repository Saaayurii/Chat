import { Request } from 'express';
import { UserDocument } from '../../database/schemas/user.schema';

export interface AuthenticatedRequest extends Request {
  user: UserDocument;
}