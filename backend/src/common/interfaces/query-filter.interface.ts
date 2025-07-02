import { Types } from 'mongoose';

export interface BaseQueryFilter {
  [key: string]: any;
}

export interface DateRangeFilter {
  $gte?: Date;
  $lte?: Date;
}

export interface TextSearchFilter {
  $regex: string;
  $options: string;
}

export interface ObjectIdFilter extends Types.ObjectId {}

export interface UpdateData {
  [key: string]: any;
  $set?: Record<string, any>;
  $unset?: Record<string, any>;
}