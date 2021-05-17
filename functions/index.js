const admin = require("firebase-admin");
admin.initializeApp();

const functions = require("firebase-functions");
const axios = require("axios");

const region = "asia-northeast1";

exports.LineWebhook = functions.region(region).https.onRequest(async (req, res) => {
    let event = req.body.events[0];
    console.log(event);
    let groupId = event.source.groupId;
    if (event.message.type === 'text') {
        let inputText = event.message.text;
        console.log(inputText)
        await admin.firestore().collection('translations').doc(groupId).set({
            input: inputText
        }).then(function () {
            console.log("Document successfully written!");
        }).catch(function (error) {
            console.error("Error writing document: ", error);
        });
    }
    return res.end();
});

exports.LineBotPush = functions.region(region).firestore.document('translations/{groupId}').onWrite(async (change, context) => {
    let latest = change.after.data();
    let input = latest.input;
    let groupId = context.params.groupId;
    let containsJapanese = input.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/);
    if (containsJapanese) {
        push(groupId, "🇹🇭 " + latest.translated.th);
    } else {
        push(groupId, "🇯🇵 " + latest.translated.ja);
    }
})

const push = (groupId, msg) => {
    return axios({
        method: "post",
        url: "https://api.line.me/v2/bot/message/push",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer DvNaidfruVOtltGBrsI0Y9zyekIHc9Fx0SPMoMiXE2UV0fOWP0P99o7NBxiG5BNc1tjCC9mTJpm5nH8w80sATuvkIb7E+IZMXiBHP1vUPsKRPwE7uXQlr/vmJZdqYAdWUW6ThDi53kQVQ/QqxoY++AdB04t89/1O/w1cDnyilFU="
        },
        data: JSON.stringify({
            to: groupId,
            // messages: [{ type: "text", text: msg }]
            messages: [{
                type: "flex",
                altText: msg,
                contents: {
                    type: "bubble",
                    size: "micro",
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "text",
                                contents: [
                                    {
                                        type: "span",
                                        text: msg,
                                        size: "sm",
                                        color: "#2d3135",
                                        weight: "bold"
                                    }
                                ],
                                wrap: true
                            }
                        ]
                    }
                }
            }]
        })
    })
}