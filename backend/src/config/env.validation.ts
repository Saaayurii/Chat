import { plainToClass, Transform } from 'class-transformer';
import { IsString, IsNumber, IsUrl, IsOptional, validateSync, IsIn, Min, Max } from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3000;

  @IsString()
  MONGO_URI: string;

  @IsString()
  REDIS_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  REFRESH_TOKEN_SECRET: string;

  @IsString()
  COOKIE_SECRET: string;

  @IsUrl()
  CLIENT_URL: string;

  @IsUrl()
  @IsOptional()
  WIDGET_URL?: string;

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  FROM_EMAIL?: string;

  @IsString()
  UPLOAD_DIR: string = '/opt/render/project/src/uploads';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  MAX_FILE_SIZE: number = 10485760; // 10MB

  @IsNumber()
  @Min(4)
  @Max(15)
  @Transform(({ value }) => parseInt(value, 10))
  BCRYPT_ROUNDS: number = 12;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_WINDOW_MS: number = 900000; // 15 minutes

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_MAX_REQUESTS: number = 100;

  @IsString()
  JWT_EXPIRES_IN: string = '15m';

  @IsString()
  REFRESH_TOKEN_EXPIRES_IN: string = '7d';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  CACHE_TTL: number = 3600;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  CACHE_MAX: number = 1000;

  @IsIn(['error', 'warn', 'info', 'debug'])
  LOG_LEVEL: string = 'info';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  HEALTH_CHECK_TIMEOUT: number = 5000;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map(error => {
      return `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`;
    }).join('\n');
    
    throw new Error(`Configuration validation failed:\n${errorMessages}`);
  }

  return validatedConfig;
}