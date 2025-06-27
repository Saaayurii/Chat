import { User } from '../../database/schemas/user.schema';
import { Types } from 'mongoose';

export interface UserResponse extends Omit<User, 'passwordHash' | '_id'> {
  _id: Types.ObjectId;
}
