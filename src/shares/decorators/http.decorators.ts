import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { UserRole } from '../enums/user.enum';
import { UserAtGuards } from 'src/modules/auth/guards/user-at.guard';
import { UserRolesGuard } from 'src/modules/auth/guards/user-roles.guard';

export const Roles = (roles: number[]): MethodDecorator & ClassDecorator => {
  return SetMetadata('roles', roles);
};

export const UserAuth = (
  roles?: UserRole[],
): MethodDecorator & ClassDecorator => {
  return applyDecorators(
    SetMetadata('roles', roles ?? []),
    UseGuards(UserAtGuards, UserRolesGuard),
    ApiBearerAuth(),
  );
};

export const ClientUserAuthPermission = (): MethodDecorator &
  ClassDecorator => {
  return applyDecorators(UseGuards());
};
