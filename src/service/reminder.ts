import { prisma } from '../prisma'
import { Prisma } from '@prisma/client'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import * as userService from './user'


dotenv.config();

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
}

//* 發送 email ----------------------------------------------------------------
export async function sendEmail({ to, subject, text }: MailOptions) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })

  const mailOptions = {
    from: `Blood-System<${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  }
  try {
    const info = await transporter.sendMail(mailOptions)
    return info
  } catch (error) {
    console.log("email 發送失敗", error)
    throw error
  }
}



//* 發送可捐血提醒 ----------------------------------------------------------------
/**
 * 1.撈出所有會員資料
 * 2.篩選出有同意提醒(1)，並且尚未提醒過的會員資料(0)
 * 3.依照當日的日期去和可捐血日期資料比對，二次篩選，當日 >= 可捐血日期 資料
 * 4.發送 email 提醒
 */

export async function handelReminder() {
  const date = new Date();
  const allUsers = await prisma.user.findMany({
    where: {
      is_reminder_active: 1,
      reminder: 0
    },
  })
  const reminderList = allUsers.filter(user => user.is_reminder_active === 1 && user.reminder !== 1)
  const reminderResult = reminderList.map(async (user) => {
    if (date >= user.reminder_date) {
      return await sendEmail({ to: user.email, subject: "可捐血提醒", text: `於 ${user.reminder_date.toLocaleDateString()}，已可再次捐血囉。` })
    }
  })
  Promise.all(reminderResult).then((res) => {
    const updateList = reminderList.map((user) => {
      const updateTarget = res.find((item) => item?.accepted[0] === user.email)
      if (updateTarget) {
        return {
          ...user,
          reminder: 1
        }
      }
    })

    updateList.forEach((item) => {
      userService.updateUserInfo(item?.id!, { reminder: item?.reminder })
    })
  })
}