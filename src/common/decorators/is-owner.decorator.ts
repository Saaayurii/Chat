import { SetMetadata } from '@nestjs/common';

export const IsOwner = (...args: string[]) => SetMetadata('is-owner', args);
