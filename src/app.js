import express from "express"
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
// *** MIDDLEWARES ***
app.use(express.json({limit:"16kb"}))   // this middleware is used to handle requests with json data format and we've set the limit to 16kb
app.use(express.urlencoded({extended: true, limit: "16kb"}))    // extended is not a necessity
// this middleware is used to handle requests different types of url encoding 
app.use(express.static("public"))   // to store assets in the public folder
app.use(cookieParser())

export { app }