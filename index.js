
// load constant value
var ErrConstant = require('./ErrConstant')

// express app instance
var express = require('express')
var app = express()

// line client instance
var line = require('@line/bot-sdk')
var JSONParseError = line.JSONParseError
var SignatureValidationFailed = line.SignatureValidationFailed
var config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
}
var client = new line.Client(config)
var template = require('./template/template')
var version = 'BETA'

// get quiz
var { getRandomQuiz }= require('./data/getRandomQuiz')

// serving website
var path = require('path')
app.use(express.static(path.join(__dirname, 'website')))

app.get('/landing', (req, res) => {
    res.sendFile(path.join(__dirname+'/website/index.html'))
})

app.get('/howtoplay', (req, res) => {
    res.sendFile(path.join(__dirname+'/website/howtoplay.html'))
})

app.get('/reportbug', (req, res) => {
    res.sendFile(path.join(__dirname+'/website/reportbug.html'))
})

app.post('/api/line_bot_webhook', line.middleware(config), (req, res) => {
    !Array.isArray(req.body.events) ?
    res.status(500).end() :
    Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).end())
    .catch((error) => {
        console.error(error)
        res.status(500).end()
    })
})

var replyText = (token, msgObj) => client.replyMessage(token, msgObj)
    .catch(error => console.log(ErrConstant.LINE.REPLYING_MESSAGE, error))

var pushText = (to, msgObj) => client.pushMessage(to, msgObj)
    .catch(error => console.log(ErrConstant.LINE.PUSHING_MESSAGE, error))

var getProfile = (userId) => client.getProfile(userId)
    .catch(error => console.log(ErrConstant.LINE.GETTING_PROFILE, error))

var trvRooms = {}

var ticker = async (trvId, secs, countAt) => {
    for (var seconds = secs; seconds > 0; seconds--) {
        if (!trvRooms[trvId].started) {
            break
        }
        if (seconds <= countAt) {
            pushText(trvId, template.message(`${seconds} detik`))
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
}

var master_ticker = async (trvId, secs, countAt) => {
    for (var seconds = secs; seconds > 0; seconds--) {
        if (trvRooms[trvId].started) {
            return
        }
        if (seconds <= countAt) {
            pushText(trvId, template.message(`${seconds} detik`))
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
    delete trvRooms[trvId]
    await pushText(trvId, [
        template.message('Room master tidak memulai Truvle, room ditutup'),
        template.info(version)
    ])
}

var startTrv = async (trvId, quiz, {prepSec, endSec}) => {
    await ticker(trvId, prepSec, 3)
    await pushText(trvId, template.quiz(quiz))
    await ticker(trvId, endSec, 3)
}

var pushQuiz = async (trvId, count) => {
    for (let i = 0; i < count; i++) {
        trvRooms[trvId].correct = []
        if (!trvRooms[trvId].started) {
            break
        }
        trvRooms[trvId].quiz = getRandomQuiz()
        await startTrv(trvId, trvRooms[trvId].quiz, { 
            prepSec: 5,
            endSec: 15
        })
        await pushText(trvId,
            template.message(`Truvle selesai, jawaban yang benar adalah "${trvRooms[trvId].quiz.word.toUpperCase()}"`))
    }    
    trvRooms[trvId].started = false
    await pushText(trvId, template.leaderboard(trvRooms[trvId].users, trvRooms[trvId].prevCount))
    await master_ticker(trvId, 30, 3)
}

var getSource = (event) => {
    if (event.source.groupId){
        return event.source.groupId
    }
    else if (event.source.roomId){
        return event.source.roomId
    }
    return event.source.userId
}

var handleMaster = async (trvId, event) => {
    if (!trvRooms[trvId]) {
        trvRooms[trvId] = {
            masterId: event.source.userId,
            started: false,
            users: {},
            correct: []
        }
        var rm_profile = await getProfile(trvRooms[trvId].masterId)
        trvRooms[trvId].users[trvRooms[trvId].masterId] = {
            displayName: rm_profile.displayName,
            score: 0
        }
        master_ticker(trvId, 30, 3)
        return Promise.resolve(
            replyText(event.replyToken,
                template.room(rm_profile.displayName)))
    }
    return Promise.resolve(
        replyText(event.replyToken,
            template.message('Room sudah tersedia')))
}

var handleStart = async (trvId, event, count) => {
    if(trvRooms[trvId]){
        if (trvRooms[trvId].masterId === event.source.userId) {
            if (trvRooms[trvId].started) {
                return Promise.resolve(
                    replyText(event.replyToken,
                        template.message('Truvle Quiz sudah dimulai')))
            }
            trvRooms[trvId].prevCount = count
            trvRooms[trvId].started = true
            pushQuiz(trvId, count)
            return Promise.resolve(
                replyText(event.replyToken,
                    template.message(`Room master telah memulai Truvle sebanyak ${count} quiz. Quiz akan muncul dalam 5 detik, Bersiap!`)))
        }
        return Promise.resolve(
            replyText(event.replyToken,
                template.message('Hanya room master yang dapat memulai quiz')))
    }
    return Promise.resolve(
        replyText(event.replyToken, [
            template.message('Room tidak tersedia'),
            template.info(version)
        ]))
}

var handleDelete = async (trvId, event) => {
    if(trvRooms[trvId]){
        if (trvRooms[trvId].masterId === event.source.userId) {
            if (trvRooms[trvId].started) {
                return Promise.resolve(
                    replyText(event.replyToken, [
                        template.message('Tidak dapat menutup room, Quiz sudah dimulai'),
                        template.stop()
                    ]))
            }
            delete trvRooms[trvId]
            return Promise.resolve(
                pushText(trvId, [
                    template.message('Room master telah menutup room'),
                    template.info(version)
                ]))
        }
        return Promise.resolve(
            replyText(event.replyToken,
                template.message('Hanya room master yang dapat menutup room')))
    }
    return Promise.resolve(
        replyText(event.replyToken, [
            template.message('Room tidak tersedia'),
            template.info(version)        
        ]))
}

var getScore = (scoreIndex) => {
    switch (scoreIndex) {
        case 1:
            return 10
        case 2:
            return 5
        case 3:
            return 4
        case 4:
            return 3
        case 5:
            return 2
        default:
            return 1
    }
}

var handleAnswer = async (trvId, event) => {
    if (trvRooms[trvId]) {
        if (trvRooms[trvId].started) {
            var userId = event.source.userId
            var userAnswer = event.message.text.toLowerCase()
            var correctAnswer = trvRooms[trvId].quiz.word.toLowerCase()
            if (userAnswer === correctAnswer && trvRooms[trvId].correct.indexOf(userId) === -1){
                trvRooms[trvId].correct.push(userId)
                var score = getScore(trvRooms[trvId].correct.length)
                var u_profile = await getProfile(userId)
                if (trvRooms[trvId].users[userId]) {
                    trvRooms[trvId].users[userId].score += score
                }else {
                    trvRooms[trvId].users[userId] = {
                        displayName: u_profile.displayName,
                        score: score
                    }
                }
                return Promise.resolve(
                    replyText(event.replyToken,
                        template.message(`Jawaban benar, ${u_profile.displayName} mendapat ${score} poin`)))
            }
        }
        return Promise.resolve(null)
    }
    return Promise.resolve(null)
}

var handleJoin = async (trvId, event) => {
    if (trvRooms[trvId]) {
        if (!trvRooms[trvId].started) {
            var u_profile = await getProfile(event.source.userId)
            if (trvRooms[trvId].users[event.source.userId]) {
                return Promise.resolve(
                    replyText(event.replyToken,
                        template.message(`${u_profile.displayName} sudah tergabung di dalam room`)))
            }
            trvRooms[trvId].users[event.source.userId] = {
                displayName: u_profile.displayName,
                score: 0
            }
            return Promise.resolve(
                replyText(event.replyToken,
                    template.message(`${u_profile.displayName} bergabung ke dalam room`)))
        }
        return Promise.resolve(
            replyText(event.replyToken,
                template.message('Tidak dapat bergabung, Quiz sudah dimulai')))
    }
    return Promise.resolve(
        replyText(event.replyToken, [
            template.message('Room tidak tersedia'),
            template.info(version)
        ]))
}

var handleStop = async (trvId, event) => {
    if(trvRooms[trvId]){
        if (trvRooms[trvId].masterId === event.source.userId) {
            if (trvRooms[trvId].started) {
                trvRooms[trvId].started = false
                return Promise.resolve(
                    replyText(event.replyToken,
                        template.message('Room master menghentikan quiz')))
            }
            return Promise.resolve(
                replyText(event.replyToken,
                    template.message('Quiz belum dimulai')))
        }
        return Promise.resolve(
            replyText(event.replyToken,
                template.message('Hanya room master yang dapat menghentikan room')))
    }
    return Promise.resolve(
        replyText(event.replyToken, [
            template.message('Room tidak tersedia'),
            template.info(version)
        ]))
}

var handleEvent = (event) => {
    if (event.type === 'follow' || event.type === 'join') {
        return Promise.resolve(
            replyText(event.replyToken,
                template.info(version)))
    }
    if(event.type !== 'message' ||
        event.message.type !== 'text'){
        return Promise.resolve(null)
    }
    var trvId = getSource(event)
    var cmd = event.message.text.split(':')
    if (cmd[0].trim().toLowerCase() === 'trv') {
        switch (cmd[1].trim().toLowerCase()) {
            case 'master':
                return handleMaster(trvId, event)
            case 'start':
                if (cmd[2]) {
                    if (parseInt(cmd[2].trim()) > 5) {
                        return handleStart(trvId, event, 5)
                    }
                    return handleStart(trvId, event, parseInt(cmd[2].trim()))
                }
                return handleStart(trvId, event, 1)
            case 'delete' :
                return handleDelete(trvId, event)
            case 'join' : 
                return handleJoin(trvId, event)
            case 'stop' : 
                return handleStop(trvId, event)
            case 'info' :
                return Promise.resolve(
                    replyText(event.replyToken,
                        template.info(version)))
            case 'poke' :
                return Promise.resolve(
                    replyText(event.replyToken,
                    template.message('Terima Kasih telah membangunkan saya :)')))
            default:
                return Promise.resolve(
                    replyText(event.replyToken,
                        template.message('Perintah tidak diketahui')))
        }
    }
    return handleAnswer(trvId, event)
}

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname+'/website/index.html'))
})

process.on('unhandledRejection', error => {
    console.log(ErrConstant.NODE.UNAHANDLED_REJECTION, error)
})

app.use((error, req, res, next) => {  
    if (error instanceof SignatureValidationFailed) {
      res.status(401).send(error.signature)
      return
    } else if (error instanceof JSONParseError) {
      res.status(400).send(error.raw)
      return
    }
    next(error)
})

app.listen(process.env.PORT)