import { Request, Response } from "express";
import { prisma } from "../prisma"
import { Prisma } from "@prisma/client";
import { hasUndefined } from "../utils/hasUndefined"

//* 註冊會員
export async function createUser(req: Request, res: Response) {
  const data: Prisma.userCreateInput = {
    username: req.body.username,
    password: req.body.password,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    gender: req.body.gender,
    isReminderActive: req.body.isReminderActive,
    reminderDate: req.body.reminderDate
  }

  if (hasUndefined(data)) {
    res.send({
      status: false,
      message: "註冊資料不完全，註冊失敗"
    })
    return
  }

  const registerResult = await prisma.user.create({ data })

  if (!registerResult) {
    res.status(401).json({
      message: "註冊失敗"
    })
    return
  }

  res.status(200).json({ message: "註冊成功", data: registerResult })
}

//* 取得會員資料
export async function getUserInfo(req: Request, res: Response) {
  const userId = req.params.id
  const getUserResult = await prisma.user.findUnique({ where: { username: userId } })

  if (!getUserResult) {
    res.status(404).json({ message: "查無此帳號" })
    return
  }

  res.status(200).json({ message: "", data: { ...getUserResult } })
}

//* 修改會員資料
export async function updateUserInfo(req: Request, res: Response) {
  const userId = req.params.id
  const data: Prisma.userUpdateInput = {
    username: req.body.username,
    password: req.body.password,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    gender: req.body.gender,
    isReminderActive: req.body.isReminderActive,
    reminderDate: req.body.reminderDate
  }

  if (hasUndefined(data)) {
    res.status(401).json({ message: "修改資料不完全，修改失敗" })
    return
  }

  const updateResult = await prisma.user.update({ where: { username: userId }, data })

  if (!updateResult) {
    res.status(401).json({ message: "修改失敗" })
  }
  res.status(200).json({ message: "修改成功", data: updateResult })
}

//* 登入會員
export async function loginUser(req: Request, res: Response) {
  const { username, password } = req.body

  const loginResult = await prisma.user.findUnique({ where: { username } })

  if (!loginResult || loginResult.password !== password) {
    res.status(401).json({ message: "帳號密碼錯誤" })
    return
  }

  req.session.user = loginResult.username

  res.status(200).json({ message: "登入成功" })
}

//* 登出會員
export async function logoutUser(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: "登出失敗" })
      return
    }
    res.clearCookie("sid");
    res.status(200).json({ message: "登出成功" })
  });
}

//* 更新下次可捐血日期
/**
 * 每新增一筆捐血紀錄，計算下次捐血日並更新
 * 1. 判斷性別男 or 女
 * 2. 男 
 *    - 依照本次捐血量計算下次可捐血日
 *    - 200cc -> 2個月，500cc -> 3個月
 * 3. 女
 *    - 撈出最新5筆捐血紀錄
 *    - 找出上次生日，到新增捐血紀錄當日內的捐血紀錄（含當日新增的捐血紀錄）
 *    - 計算範圍內的捐血量是否已達 1000cc
 *    - 已達 1000cc，下次捐血日為生日過後隔一天
 *    - 未達 1000cc，則依照此次新增捐血紀錄的血量計算下次捐血日期
 *    - 200cc -> 2個月，500cc -> 3個月
 */
export async function setReminder(id: number) {

}