import express, { Express } from 'express';
import router from "./router/index"
import session from 'express-session'
import cron from 'node-cron'
import dotenv from 'dotenv'
import cors from 'cors'
import { handelReminder } from './service/reminder'

dotenv.config();
const app: Express = express();
const sessionStore = new session.MemoryStore();
const sessionSecret = process.env.SESSION_SECRET ?? ''
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigin = process.env.CLIENT_URL;
        if (!origin || origin === allowedOrigin) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'), false);
        }
    },
    credentials: true,
}
app.set('trust proxy', 1); // 让 Express 信任代理
app.use(cors(corsOptions))

//* express-session
app.use(session({
    secret: sessionSecret,
    name: 'user',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 設置 cookie 有效期
        secure: process.env.PRODUCTION === 'production',
        sameSite: 'none' // 允許網站請求攜帶 Cookie
    },
}))

cron.schedule('0 0 * * *', () => {
    handelReminder()
    sessionStore.clear((err) => {
        if (err) {
            console.log('failed to clear session reasons', err);
        } else {
            console.log('All session cleared.')
        }
    })
})


app.use(express.json());
router(app)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
