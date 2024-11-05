import { prisma } from "../prisma"
import { Prisma } from "@prisma/client";

//* 新增捐血紀錄 ----------------------------------------------------------------
export async function createBloodRecord(data: Prisma.bloodRecordCreateInput) {
  const result = await prisma.bloodRecord.create({ data })
  return result
}

//* 修改捐血紀錄 ----------------------------------------------------------------
export async function updateBloodRecord(id: number, data: Prisma.bloodRecordUpdateInput) {
  if ('id' in data) {
    delete data['id']
  }
  const result = await prisma.bloodRecord.update({
    where: { id },
    data,
  })
  return result
}

//* 取得捐血紀錄 ----------------------------------------------------------------
export async function getBloodRecord(uid: number) {
  const result = await prisma.bloodRecord.findMany({
    where: { uid },
  })
  return result
}