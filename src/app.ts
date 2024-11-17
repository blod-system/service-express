import express, { Express } from 'express';
import router from "./router/index"
import session from 'express-session'
import cron from 'node-cron'
import dotenv from 'dotenv'
import { handelReminder } from './service/reminder'

dotenv.config();
const app: Express = express();
const sessionStore = new session.MemoryStore();
const sessionSecret = process.env.SESSION_SECRET ?? ''

app.use(express.json());

//* express-session
app.use(session({
    secret: sessionSecret,
    name: 'user',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { maxAge: 24 * 60 * 60 * 1000, secure: true } // 設置 cookie 有效期
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
