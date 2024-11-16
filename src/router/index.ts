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
    res.status(401).send({
      message: "登入逾期"
    })
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
  userRouter.get("/userinfo", user.getUserInfo)
  userRouter.get("/logout", user.logoutUser)
  userRouter.post("/register", user.createUser)
  userRouter.post("/login", user.loginUser)
  userRouter.put("/update", user.updateUserInfo)

  // record
  const recordRouter = express.Router();
  router.use("/record", recordRouter)
  recordRouter.get("/:uid", record.getBloodRecord)
  recordRouter.post("/create", record.createBloodRecord)
  recordRouter.put("/update", record.updateBloodRecord)

  // upload pdf
  const uploadRouter = express.Router()
  router.use("/upload", uploadRouter)
  uploadRouter.post('/', upload.single('file'), record.uploadFile)
  // uploadRouter.get('/upload/:id', record.getUploadFiles)

  app.use(router)
}
