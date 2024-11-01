import express, { Express, Request, Response, NextFunction } from "express";
import 'express-session'
import * as user from '../control/user'

declare module 'express-session' {
  interface SessionData {
    user?: string
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

  // user
  const userRouter = express.Router();
  router.use("/user", auth, userRouter)
  userRouter.get("/userinfo/:id", user.getUserInfo)

  app.use(router)
}