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
    origin: (origin: any, callback: any) => {
        if (origin === process.env.CLIENT_URL || !origin) {
            callback(null, true)
        } else {
            callback(new Error("CORS policy error: Origin not allowed"), false)
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json());

//* express-session
app.use(session({
    secret: sessionSecret,
    name: 'user',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { maxAge: 24 * 60 * 60 * 1000, secure: false } // 設置 cookie 有效期
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

router(app)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
