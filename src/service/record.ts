import { prisma } from "../prisma"
import { Prisma } from "@prisma/client";
import dotenv from 'dotenv'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from "stream";

dotenv.config()

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

//* 上傳 PDF
export async function uploadFileToR2(file: Express.Multer.File) {
  if (!file) return null
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    }
  })

  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `pdf/${file.originalname}`,
    Body: file.buffer,
    ContentType: 'application/pdf'
  }

  const command = new PutObjectCommand(uploadParams)
  const res = await s3Client.send(command)
  if (!res) {
    return null
  }

  return {
    message: 'File uploaded successfully',
    url: `https://pub-f98ae2284fcc475493d4204d4b2a3a0a.r2.dev/pdf/${file.originalname}`
  }
}

//* 取得 PDF 
export async function getFileFromR2(key: string) {
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    }
  })
  const downloadParams = {
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: `pdf/${key}.pdf`,
  };

  const command = new GetObjectCommand(downloadParams);
  const { Body } = await s3Client.send(command);

  if (Body instanceof Readable) {
    return Body;
  } else {
    throw new Error('Failed to retrieve file');
  }
}