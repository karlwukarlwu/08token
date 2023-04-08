const path = require('path');
const express = require('express');
const https = require('https');
const fs = require('fs');
// helmet是一个express中间件 保护信息的
// 真你妈是头盔啊
// 保护response的header
const helmet = require('helmet');
const passport = require('passport');
const {Strategy} = require('passport-google-oauth20');

require('dotenv').config();
const PORT = 3000;

// 这里配置从Google拿到的clientID和clientSecret
const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
}
// 这里开始配置passport 在下面要用use 启动passport
const AUTH_OPTIONS = {
    callbackURL: '/auth/google/callback',
    // 这个要和google 里面配置的一样
    // https://localhost:3000/auth/google/callback 这里是谷歌配置的
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
}

// 这个函数的触发是在浏览器送出token 然后google返回一个token 以后
function verifyCallback(accessToken, refreshToken, profile, done) {
    // 这一步好像是为了和数据库那边交互的
    console.log("google profile", profile);
    // 成功了返回一个done
      
    done(null, profile)
//     done: a function that is called when the authentication process is complete
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

const app = express();
//在第一层use直接架上helmet
app.use(helmet());
// 这里要启动passport
app.use(passport.initialize());

function checkLogin(req, res, next) {
    const isLoggedIn = true;
    if (isLoggedIn) {
        return res.status(401).json({
            message: 'You are not logged in'
        })
    }
    next();
}

// app.use((req, res, next) => {
//     const isLoggedIn = true;
//     if (isLoggedIn) {
//         return res.status(401).json({
//             message: 'You are not logged in'
//         })
//     }
//     next();
// })

app.get('/auth/google', passport.authenticate('google', {
    scope: ['email']
}))

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/failure',
        successRedirect: '/',
        session: false,
    //      操你妈 我括号加错位置了
    }), (req, res) => {
        console.log("google called us back")
    })


app.get('/failure', (req, res) => {
    return res.send('You failed to login with Google');
})
app.get('/auth/logout', (req, res) => {
})


// 可以自己加上自己的中间件
// 如何限制api访问
app.get('/secret', checkLogin, (req, res) => {
    return res.send('You found the secret page!');
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})
// app.listen(PORT, () => {
//     console.log(`Server started on port ${PORT}`)
// })
// https://localhost:3000/
// 当我们这样设置以后 必须要加上https://才能运行

https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
}, app).listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
});