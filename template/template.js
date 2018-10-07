
var links = {
    default : "https://truvle.herokuapp.com/landing",
    learnToPlay : "https://truvle.herokuapp.com/howtoplay",
    reportBug : "https://truvle.herokuapp.com/reportbug",
    mainImage : "https://preview.ibb.co/hx4N4K/tq.png"
}

var info = (version) => {
    return {
        type: "flex",
        altText: "Truvle Info",
        contents: {
            type: "bubble",
            header: {
            type: "box",
            layout: "horizontal",
            contents: [
                {
                type: "text",
                text: "TRUVLE QUIZ",
                weight: "bold",
                color: "#1DB446",
                size: "md"
                },
                {
                type: "text",
                text: version || "BETA",
                weight: "bold",
                color: "#aaaaaa",
                size: "md"
                }
            ]
            },
            hero: {
            type: "image",
            url: links.mainImage,
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
            action: {
                type: "uri",
                uri: links.default
            }
            },
            body: {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: [
                {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                    type: "button",
                    style: "link",
                    height: "sm",
                    action: {
                        type: "uri",
                        label: "Pelajari cara bermainnya",
                        uri: links.learnToPlay
                    }
                    },
                    {
                    type: "separator"
                    },
                    {
                    type: "button",
                    style: "link",
                    height: "sm",
                    action: {
                        type: "uri",
                        label: "Laporkan temuan \"bug\"",
                        uri: links.reportBug
                    }
                    },
                    {
                    type: "separator"
                    }
                ]
                }
            ]
            },
            footer: {
            type: "box",
            layout: "horizontal",
            contents: [
                {
                type: "button",
                style: "primary",
                height: "sm",
                action: {
                    type: "message",
                    label: "Buat Room",
                    text: "trv:master"
                }
                }
            ]
            }
        }
    }
}

var leaderboardItem = (displayName, score) => {
    return {
        type: 'box',
        layout: 'baseline',
        spacing: 'sm',
        contents: [
            {
                type: 'text',
                text: `${displayName}`,
                wrap: true,
                color: '#666666',
                size: 'sm',
                flex: 1
            },
            {
                type: 'filler'
            },
            {
                type: 'text',
                text: `${score} pts`,
                wrap: true,
                color: '#666666',
                size: 'sm',
                flex: 1
            }
        ]
    }
}

var leaderboard = (users, prevCount) => {
    var flex = {  
        type: "flex",
        altText: "Hasil Truvle Quiz",
        contents: {
            type: 'bubble',
            header: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                type: 'text',
                text: 'Perolehan Poin',
                weight: 'bold',
                color: '#1DB446',
                size: 'xl',
                flex: 1
                },
                {
                type: 'separator',
                margin: 'xs'
                }
            ]
            },
            body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                type: 'box',
                layout: 'horizontal',
                spacing: 'sm',
                contents: [
                    {
                    type: 'text',
                    text: 'Nama',
                    weight: 'bold',
                    color: '#000000',
                    size: 'sm',
                    flex: 1
                    },
                    {
                    type: 'filler'
                    },
                    {
                    type: 'text',
                    text: 'Poin',
                    weight: 'bold',
                    wrap: true,
                    color: '#000000',
                    size: 'sm',
                    flex: 1
                    }
                ]
                },
                {
                type: 'separator',
                margin: 'xxl'
                }
            ]
            },
            footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
                {
                type: 'text',
                text: 'Apakah anda ingin memulai quiz dengan format yang sama?',
                weight: 'bold',
                wrap: true,
                color: '#000000',
                size: 'sm',
                flex: 1
                },
                {
                type: "text",
                text: "(Room ditutup dalam 30 detik)",
                wrap: true,
                color: "#666666",
                size: "sm",
                flex: 1
                },
                {
                type: 'box',
                layout: 'horizontal',
                spacing: 'sm',
                contents: [
                    {
                    type: 'button',
                    style: 'primary',
                    height: 'sm',
                    action: {
                        type: 'message',
                        label: 'Ya',
                        text: 'trv:start'
                    }
                    },
                    {
                    type: 'button',
                    style: 'primary',
                    height: 'sm',
                    action: {
                        type: 'message',
                        label: 'Tidak',
                        text: 'trv:delete'
                    }
                    }
                ]
                }
            ]
            }
        }
    }
    for (const key in users) {
        if (users.hasOwnProperty(key)) {
            const user = users[key];
            flex.contents.body.contents.splice(1, 0, leaderboardItem(user.displayName, user.score))
        }
    }
    flex.contents.footer.contents[2].contents[0].action.text = `trv:start:${prevCount}`
    return flex
}

var quiz = (quiz) =>  {
    return {
        type: "flex",
        altText: "Truvle Quiz!",
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                contents: [{
                    type: "text",
                    text: `${quiz.clue.toUpperCase()}`,
                    wrap: true,
                    weight: "bold",
                    color: "#1DB446",
                    size: "sm"
                },
                {
                    type: "text",
                    text: `${quiz.shuffledWord.toUpperCase()}`,
                    wrap: true,
                    weight: "bold",
                    size: "xxl",
                    margin: "md"
                }]
            }
        }
    }
}

var message = (text) =>  {
    return { type: 'text', text: text }
}

var room = (displayName) => {
    return {
        type: "flex",
        altText: `Room telah dibuat oleh ${displayName}`,
        contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "Room",
                  weight: "bold",
                  color: "#1DB446",
                  size: "xl",
                  flex: 1
                },
                {
                  type: "separator",
                  margin: "xs"
                }
              ]
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: `Room telah dibuat oleh ${displayName}, tekan \"Join\" untuk ikut bermain.`,
                  wrap: true,
                  weight: "bold",
                  color: "#000000",
                  size: "sm"
                },
                {
                  type: "text",
                  text: "Hanya pembuat Room yang dapat me-\"Mulai\" quiz.",
                  wrap: true,
                  weight: "bold",
                  color: "#aaaaaa",
                  size: "sm"
                },
                {
                  type: "separator",
                  margin: "xl"
                }
              ]
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "(Room ditutup dalam 30 detik)",
                  wrap: true,
                  color: "#666666",
                  size: "sm",
                  flex: 1
                },
                {
                  type: "box",
                  layout: "horizontal",
                  spacing: "sm",
                  contents: [
                    {
                      type: "button",
                      style: "primary",
                      height: "sm",
                      action: {
                        type: "message",
                        label: "Mulai",
                        text: "trv:start:3"
                      }
                    },
                    {
                      type: "button",
                      style: "primary",
                      height: "sm",
                      action: {
                        type: "message",
                        label: "Join",
                        text: "trv:join"
                      }
                    }
                  ]
                }
              ]
            }
        }
    }
}

var stop = () => {
    return {
        type: "template",
        altText: "Apakah anda ingin menghentikan quiz?",
        template: {
            type: "confirm",
            text: "Apakah anda ingin menghentikan quiz?",
            actions: [
                {
                  type: "message",
                  label: "Ya",
                  text: "trv:stop"
                },
                {
                  type: "message",
                  label: "Tidak",
                  text: "Tidak"
                }
            ]
        }
      }
}

module.exports = {
    message,
    quiz,
    leaderboard,
    info,
    room,
    stop
}