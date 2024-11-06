import express, { Express, Request, Response, NextFunction } from "express";
import 'express-session'
import * as user from '../control/user'
import * as record from '../control/record'
import multer from 'multer'
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number,
      name: string
    }
  }
}

function auth(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    next()
  } else {
    console.log("401")
    // res.status(401).send({
    //   message: "登入逾期"
    // })
    next()
    return
  }
}

export default async function (app: Express) {
  const router = express.Router();
  const upload = multer()
  // user
  const userRouter = express.Router();
  router.use("/user", userRouter)
  userRouter.get("/userinfo/:id", user.getUserInfo)
  // record
  const recordRouter = express.Router();
  router.use("/record", recordRouter)
  // upload pdf 
  recordRouter.post('/upload', upload.single('file'), record.uploadFile)
  recordRouter.get('/upload/:id', record.getUploadFiles)

  app.use(router)
}