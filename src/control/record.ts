import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { hasUndefined } from "../utils/hasUndefined"
import { UpdateRecord } from "../types"
import * as user from "./user"
import * as recordService from "../service/record"

//* 新增捐血紀錄 ----------------------------------------------------------------
export async function createBloodRecord(req: Request, res: Response) {
  const data: Prisma.bloodRecordCreateInput = {
    ...req.body,
    report_url: req.body.report_url ?? null,
  }

  if (hasUndefined(data)) {
    res.send({
      status: 401,
      message: "新增失敗，資料不完整",
      data: null
    })

    return
  }
  console.log("data ----> ", data)
  try {
    const createResult = await recordService.createBloodRecord(data)

    if (!createResult) {
      res.send({
        status: 401,
        message: "新增失敗",
        data: null
      })
      return
    }

    await user.updateReminderDate(data.uid)
    res.send({
      status: 200,
      message: "新增成功",
      data: null
    })

  } catch (error) {
    res.send({
      status: 500,
      message: "新增失敗，請稍候重試",
      data: null
    })

    console.log("新增捐血紀錄及更新下次捐血日期失敗", error)
  }
}

//* 取得捐血紀錄 ----------------------------------------------------------------
export async function getBloodRecord(req: Request, res: Response) {
  const data = Number(req.params.uid)

  if (!data) {
    res.send({
      status: 401,
      message: "請先登入",
      data: null
    })

    return
  }
  try {

    const getResult = await recordService.getBloodRecord(data);

    if (!getResult) {
      res.send({
        status: 404,
        message: "查無捐血紀錄",
        data: null
      })
      return
    }
    res.send({
      status: 200,
      message: "",
      data: getResult
    })
  } catch (error) {
    console.log(error)
  }
}

//* 修改捐血紀錄 ----------------------------------------------------------------
export async function updateBloodRecord(req: Request, res: Response) {
  const data: UpdateRecord = { ...req.body }

  if (hasUndefined(data)) {
    res.send({
      status: 401,
      message: "修改失敗，資料不完整",
      data: null
    })

    return
  }

  try {
    const updateResult = await recordService.updateBloodRecord(data.id, data);

    if (!updateResult) {
      res.send({
        status: 404,
        message: "修改捐血紀錄失敗",
        data: null
      })
    }

    if ('date' in data) {
      await user.updateReminderDate(data.uid)
    }
    res.send({
      status: 200,
      message: "修改成功",
      data: updateResult
    })

  } catch (error) {
    res.send({
      status: 500,
      message: "修改失敗，請稍候重試",
      data: null
    })

    console.log("修改捐血紀錄後，更新下次捐血日期失敗", error)
  }
}

//* 上傳 PDF
export async function uploadFile(req: Request, res: Response) {
  const file = req.file
  if (!file) {
    res.send({
      status: 400,
      message: "No file update",
      data: file
    })

    return
  }

  try {
    const result = await recordService.uploadFileToR2(file)
    if (!result) {
      throw (result)
    }
    res.send({
      status: 200,
      message: "",
      data: result
    })

  } catch (error) {
    res.send({
      status: 404,
      message: "上傳失敗",
      data: null
    })
  }
}

//* 取得上傳檔案 (暫時不需要)
// export async function getUploadFiles(req: Request, res: Response) {
//   const { id } = req.params;

//   try {
//     const fileStream = await recordService.getFileFromR2(id);
//     res.setHeader('Content-Type', 'application/pdf');
//     fileStream.pipe(res);
//   } catch (error) {
//     res.send({
//       status: 404,
//       message: "File not found",
//       data: error
//     })
//   }
// }