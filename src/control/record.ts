import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { hasUndefined } from "../utils/hasUndefined"
import { UpdateRecord } from "../types"
import * as user from "./user"
import * as recordService from "../service/record"

//* 新增捐血紀錄 ----------------------------------------------------------------
export async function createBloodRecord(req: Request, res: Response) {
  const data: Prisma.bloodRecordCreateInput = {
    uid: req.body.uid,
    user_account: req.body.userAccount,
    date: req.body.date,
    volume_ml: req.body.volumeMl,
    report_url: req.body.reportUrl ?? null,
  }

  if (hasUndefined(data)) {
    res.status(401).json({ message: "新增失敗，資料不完整" })
    return
  }

  const createResult = await recordService.createBloodRecord(data)

  if (!createResult) {
    res.status(401).json({ message: "新增失敗" })
  }

  try {
    await user.updateReminderDate(data.uid)
    res.status(200).json({ message: "新增成功" })
  } catch (error) {
    res.status(500).json({ message: "新增失敗，請稍候重試" })
    console.log("新增捐血紀錄後，更新下次捐血日期失敗", error)
  }
}

//* 取得捐血紀錄 ----------------------------------------------------------------
export async function getBloodRecord(req: Request, res: Response) {
  const data = req.body.uid
  if (!data) {
    res.status(401).json({ message: "請先登入" })
    return
  }

  const getResult = await recordService.getBloodRecord(data);

  if (!getResult) {
    res.status(404).json({ message: "查無捐血紀錄" })
  }
  res.status(200).json({ message: "", data: getResult })
}

//* 修改捐血紀錄 ----------------------------------------------------------------
export async function updateBloodRecord(req: Request, res: Response) {
  const data: UpdateRecord = { ...req.body }

  if (hasUndefined(data)) {
    res.status(401).json({ message: "修改失敗，資料不完整" })
    return
  }

  const updateResult = await recordService.updateBloodRecord(data.id, data);

  if (!updateResult) {
    res.status(404).json({ message: "修改捐血紀錄失敗" })
  }

  try {
    if ('date' in data) {
      await user.updateReminderDate(data.uid)
    }
    res.status(200).json({ message: "修改成功", data: updateResult })
  } catch (error) {
    res.status(500).json({ message: "修改失敗，請稍候重試" })
    console.log("修改捐血紀錄後，更新下次捐血日期失敗", error)
  }
}

//* 上傳 PDF
export async function uploadFile(req: Request, res: Response) {
  const file = req.file
  if (!file) {
    console.log("============= file::::", file)

    res.status(400).send({ message: "No file uploaded", data: file })
    return
  }

  try {
    const result = await recordService.uploadFileToR2(file)
    if (!result) {
      throw (result)
    }
    console.log("upload result", result)
    res.status(200).json({ data: result })
  } catch (error) {
    res.status(404).json({ message: "upload filed" })
  }
}

//* 取得上傳檔案
export async function getUploadFiles(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const fileStream = await recordService.getFileFromR2(id);
    res.setHeader('Content-Type', 'application/pdf');
    fileStream.pipe(res);
  } catch (error) {

    res.status(404).json({ message: 'File not found', error });
  }
}