import express from "express"
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express();

// *** MIDDLEWARES ***
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}))   // this middleware is used to handle requests with json data format and we've set the limit to 16kb
app.use(express.urlencoded({extended: true, limit: "16kb"}))    // extended is not a necessity
// this middleware is used to handle requests different types of url encoding 
app.use(express.static("public"))   // to store assets in the public folder
app.use(cookieParser())

// *** Routes import ***
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import playlistRouter from './routes/playlist.routes.js'

// *** Routes declaration ***
app.use("/api/v1/users", userRouter)   // previously we were writing directly everything in app.js, now we are incorporating middleware to give control to userRouter.
// This will act as a prefix.
// URL: http://localhost:8000/api/v1/users/register
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/playlist", playlistRouter)
export { app }