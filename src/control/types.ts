import { Prisma } from "@prisma/client";

export interface UpdateRecord extends Prisma.bloodRecordUpdateInput {
  recordId: number
}