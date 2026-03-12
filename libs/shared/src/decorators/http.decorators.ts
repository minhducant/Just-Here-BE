import { checkElementsExist } from '@app/shared/helpers/utils';
import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@app/shared/enums/user.enum';
import { UserAtGuards } from '@app/shared/guards/user-at.guard';
import { UserRolesGuard } from '@app/shared/guards/user-roles.guard';

export { checkElementsExist };

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
