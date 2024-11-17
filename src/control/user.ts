import { Request, Response } from "express";
import { prisma } from "../prisma"
import { Prisma } from "@prisma/client";
import { hasUndefined } from "../utils/hasUndefined"
import * as userService from '../service/user'

//* 註冊會員 ----------------------------------------------------------------
export async function createUser(req: Request, res: Response) {
  const data: Prisma.userCreateInput = {
    account: req.body.account,
    password: req.body.password,
    birthday: req.body.birthday,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    gender: req.body.gender,
    is_reminder_active: 1,
    reminder_date: null
  }

  if (hasUndefined(data)) {
    res.send({
      status: false,
      message: "註冊資料不完全，註冊失敗"
    })
    return
  }
  try {
    const registerResult = await userService.registerUser(data)

    if (!registerResult) {
      res.send({
        status: 401,
        message: "註冊失敗，此會員已存在",
        data: null
      })
      return
    }
    res.send({
      status: 200,
      message: "註冊成功",
      data: null
    })
  } catch (error) {
    console.log(error)
  }
}

//* 取得會員資料 ----------------------------------------------------------------
export async function getUserInfo(req: Request, res: Response) {
  const data = {
    id: req?.session?.user?.id,
    account: req?.session?.user?.name
  }

  if (hasUndefined(data)) {
    res.send({
      status: 400,
      message: "請重新登入",
      data: null
    })
    return
  }
  try {

    const getUserResult = await userService.getUserInfo(data.id!, data.account!)

    if (!getUserResult) {
      res.send({
        status: 404,
        message: '查無此帳號',
        data: null
      })
      return
    }
    res.send({
      status: 200,
      message: '',
      data: getUserResult
    })
  } catch (error) {
    console.log(error)
  }
}

//* 修改會員資料 ----------------------------------------------------------------
export async function updateUserInfo(req: Request, res: Response) {
  const userId = req.session.user?.id
  const data: Prisma.userUpdateInput = { ...req.body }

  if (!userId) {
    res.send({
      status: 401,
      message: "登入逾期，請重新登入",
      data: null
    })

    return
  }

  if (hasUndefined(data)) {
    res.send({
      status: 401,
      message: "修改資料不完全，修改失敗",
      data: null
    })

    return
  }
  try {

    const updateResult = await userService.updateUserInfo(userId, data)

    if (!updateResult) {
      res.send({
        status: 401,
        message: "修改失敗",
        data: null
      })
      return
    }
    res.send({
      status: 200,
      message: "修改成功",
      data: updateResult
    })
  } catch (error) {
    console.log(error)
  }
}

//* 登入會員 ----------------------------------------------------------------
export async function loginUser(req: Request, res: Response) {
  const { account, password } = req.body
  if (!account || !password) {
    res.send({ status: 401, message: "請輸入帳號密碼", data: null })
    return
  }
  try {
    const loginResult = await userService.loginUser(account)
    if (!loginResult) {
      res.send({
        status: 404,
        message: "尚未註冊",
        data: null
      })
      return
    }

    if (loginResult.password !== password) {
      res.send({
        status: 401,
        message: "帳號密碼錯誤",
        data: null
      })

      return
    }

    req.session.user = {
      id: loginResult.id,
      name: loginResult.account
    }

    res.status(200).json({
      status: 200,
      message: "登入成功",
      data: null
    })
  } catch (error) {
    console.log(error)
  }
}

//* 登出會員
export async function logoutUser(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      res.send({
        status: 500,
        message: "登出失敗，請稍候在試",
        data: null
      })

      return
    }
    res.clearCookie("sid");
    res.send({
      status: 200,
      message: "登出成功",
      data: null
    })

  });
}

//* 更新下次可捐血日期 ----------------------------------------------------------------
/**
 * 每新增一筆捐血紀錄，計算下次捐血日並更新
 * 1. 判斷性別男 or 女
 * 2. 男 
 *    - 依照本次捐血量計算下次可捐血日
 *    - 250cc -> 2個月，500cc -> 3個月
 * 3. 女
 *    - 撈出最新5筆捐血紀錄
 *    - 找出上次生日，到新增捐血紀錄當日內的捐血紀錄（含當日新增的捐血紀錄）
 *    - 計算範圍內的捐血量是否已達 1000cc
 *    - 已達 1000cc，下次捐血日為生日過後隔一天
 *    - 未達 1000cc，則依照此次新增捐血紀錄的血量計算下次捐血日期
 *    - 250cc -> 2個月，500cc -> 3個月
 */
export async function updateReminderDate(id: number) {
  if (!id) return null
  try {

    const user = await prisma.user.findUnique({ where: { id: id } })
    const recentBloodRecords = await prisma.bloodRecord.findMany({
      where: { uid: id },
      orderBy: { date: 'desc' },
      take: 5,
    })

    if (!user || !recentBloodRecords) return null
    const nextDonationDate = new Date(recentBloodRecords[0].date)

    if (user?.gender === "men") {
      const bloodVolumeMl = recentBloodRecords[0].volume_ml
      const monthToAdd = bloodVolumeMl === 250 ? 2 : bloodVolumeMl === 500 ? 3 : 0;
      nextDonationDate.setMonth(nextDonationDate.getMonth() + monthToAdd)
    } else {
      const currentDay = new Date() // 當前日期
      const year = currentDay.getFullYear() // 當前年份
      const userBirthday = new Date(user.birthday)
      // 使用者當前年份的生日 年-月-日
      const thisYearUserBirthday = new Date(year, userBirthday.getMonth(), userBirthday.getDate())
      const recentBirthday = thisYearUserBirthday > currentDay ?
        new Date(year - 1, userBirthday.getMonth(), userBirthday.getDate())
        : thisYearUserBirthday
      // 篩選最近一次生日到下一次生日為期一年內的捐血紀錄
      const bloodRecords = recentBloodRecords.filter((record) => {
        const date = new Date(record.date)
        return date > recentBirthday
      })
      // 捐血量加總
      const volumeMlTotal = bloodRecords.reduce((volume, value) => {
        return volume + value.volume_ml
      }, 0)

      if (volumeMlTotal < 1000) {
        const bloodVolumeMl = recentBloodRecords[0].volume_ml
        const monthToAdd = bloodVolumeMl === 250 ? 2 : bloodVolumeMl === 500 ? 3 : 0;
        nextDonationDate.setMonth(nextDonationDate.getMonth() + monthToAdd)
      } else {
        nextDonationDate.setFullYear(year)
        nextDonationDate.setMonth(thisYearUserBirthday.getMonth(), thisYearUserBirthday.getDate() + 1)
      }
    }

    user.reminder_date = nextDonationDate
    // 檢查使用者是否有需要提醒，若有需要提醒則把已提醒改為未提醒
    if (user.is_reminder_active) {
      user.reminder = 0
    }
    const updateResult = await userService.updateUserInfo(id, user)

    return updateResult
  } catch (error) {
    console.log(error)
  }
}
