import { Request, Response } from "express";
import { prisma } from "../prisma"
import { Prisma } from "@prisma/client";
import { hasUndefined } from "../utils/hasUndefined"
import * as user from "./user"

//* 新增捐血紀錄
export async function createBloodRecord(req: Request, res: Response) {
  const data: Prisma.bloodRecordCreateInput = {
    uid: req.body.uid,
    user_account: req.body.userAccount,
    date: req.body.date,
    volume_ml: req.body.volumeMl,
    report_url: null
  }

  if (hasUndefined(data)) {
    res.status(401).json({ message: "新增失敗，資料不完整" })
    return
  }

  const createResult = await prisma.bloodRecord.create({ data })

  if (!createResult) {
    res.status(401).json({ message: "新增失敗" })
  }

  res.status(200).json({ message: "新增成功" })

  try {
    await user.setReminder(data.uid)
  } catch (error) {
    console.log("新增捐血紀錄後，更新下次捐血日期失敗", error)
  }
}

//* 取得捐血紀錄
export async function getBloodRecord(req: Request, res: Response) {
  const data = req.body.uid
  if (!data) {
    res.status(401).json({ message: "取得失敗，UID 不完整" })
    return
  }
  const getResult = await prisma.bloodRecord.findMany({
    where: { uid: data }
  });
  if (!getResult) {
    res.status(404).json({ message: "取得捐血紀錄失敗" })
  }
  res.status(200).json({ message: "", data: getResult })
}

//* 修改捐血紀錄
export async function updateBloodRecord(req: Request, res: Response) {
  const data: Prisma.bloodRecordUpdateInput = {
    recordId: req.body.id,
    uid: req.body.uid,
    user_account: req.body.userAccount,
    date: req.body.date,
    volume_ml: req.body.volumeMl,
    report_url: req.body.reportUrl
  }

  if (hasUndefined(data)) {
    res.status(401).json({ message: "修改失敗，資料不完整" })
    return
  }

  const updateResult = await prisma.bloodRecord.update({
    where: { id: data.recordId },
    data
  });

  if (!updateResult) {
    res.status(404).json({ message: "修改捐血紀錄失敗" })
  }

  res.status(200).json({ message: "修改成功", data: updateResult })
}