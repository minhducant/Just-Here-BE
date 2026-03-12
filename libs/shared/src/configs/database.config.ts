import { getConfig } from './index';
import { MongooseModuleOptions, SchemaOptions } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import mongooseAggregatePaginateV2 from '../libs/mongoose-aggregate-paginate-v2';

const addedPaginate = require('mongoose-aggregate-paginate-v2');

export const mongodb = {
  uri: getConfig().get<string>('mongodb.uri'),
  options: {
    directConnection: true,
    connectionFactory: (connection: any) => {
      connection.plugin(addedPaginate);
      connection.plugin(mongooseAggregatePaginateV2);
      return connection;
    },
  } as MongooseModuleOptions,
};

export const Options: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_, ret: any) {
      delete ret.id;
      delete ret.__v;
      return formatDecimal(ret);
    },
  },
  toObject: {
    virtuals: true,
    transform: function (_, ret: any) {
      delete ret.id;
      delete ret.__v;
      return formatDecimal(ret);
    },
  },
};

export const formatDecimal = (ret: any): any => {
  if (ret instanceof Types.Decimal128) {
    return ret.toString();
  }
  if (Array.isArray(ret)) {
    ret.forEach((_, i) => (ret[i] = formatDecimal(ret[i])));
    return ret;
  }
  if (typeof ret === 'object' && ret !== null) {
    try {
      for (const key of Object.keys(ret)) {
        ret[key] = formatDecimal(ret[key]);
      }
    } catch {}
    return ret;
  }
  return ret;
};
