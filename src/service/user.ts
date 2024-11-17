import { Prisma } from "@prisma/client";
import { prisma } from "../prisma"

//* 註冊會員 ----------------------------------------------------------------
export async function registerUser(data: Prisma.userCreateInput) {
  const result = await prisma.user.create({ data })
  return result
}

//* 登入會員 ----------------------------------------------------------------
export async function loginUser(account: string) {
  console.log(account)
  const result = await prisma.user.findUnique({ where: { account: account } })
  return result

}

//* 取得會員資料 ----------------------------------------------------------------
export async function getUserInfo(id: number, account: string) {
  const result = await prisma.user.findUnique({ where: { id: id, account: account } })
  return result
}

//* 修改會員資料 ----------------------------------------------------------------
export async function updateUserInfo(id: number, data: Prisma.userUpdateInput) {
  if ('id' in data) {
    delete data['id']
  }

  const updateResult = await prisma.user.update(
    {
      where: { id: id },
      data
    })

  return updateResult
}


