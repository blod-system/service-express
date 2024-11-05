import { Prisma } from "@prisma/client";

export interface UpdateRecord extends Prisma.bloodRecordUpdateInput {
  id: number
  uid: number
}

// export type UpdateUserInfo = Required<Pick<Prisma.userWhereUniqueInput, "account">> & Omit<Prisma.userUpdateInput, "account">

export type UpdateUserInfo = Prisma.userUpdateInput