import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const crypto = require("crypto");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const supabaseUrl = 'https://jlczfqoaymosqoomgzxx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const __dirname = path.dirname(require("url").fileURLToPath(import.meta.url));

const bannedWords = ["izbica", "izbice", "serb", "yugoslav", "milosevic", "slobodan", "radovan", "karadzic", "ratko", "biljana", "plavsic", "srpska", "srpski"]

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

let deviations = 0;

function generateInvite() {
    deviations++;
    if (deviations == 68419) {
        deviations = 0;
    }
    let time = `${new Date().toString()} ${deviations} i love oily black men <3 我爱油腻腻的黑人`;
    let hash = crypto.createHash("md5").update(time).digest("hex").substring(0, 5);
    return hash;
}

function returnAppend(old, data) {
    if (old) {
        let teagueIsUgly = [...old];
        teagueIsUgly.push(data);
        return teagueIsUgly;
    }

    return [data];
}
function hash(data) {
    return crypto.createHash('md5').update("i_hate_diggers_5967_" + data).digest("hex");
}

function getPublicFile(file) {
    return `${__dirname}/public/${file}`;
}

function isAppropriate(str) {
    for (let i = 0; i < bannedWords.length; i++) {
        if (str.includes(bannedWords[i])) {
            return false;
        }
    }
    return true;
}

async function createAccount(username, password) {
    if (!isAppropriate(username)) {
        return {
            message: "Innapropriate username",
            success: false
        };
    }

    if (password.length < 5) {
        if (password.length <= 2) {
            return {
                message: "That password tho",
                success: false
            };
        }
        return {
            message: "Password has to be at least 5 characters long",
            success: false
        };
    }
    if (!password.includes("ALBANIA")) {
        return {
            message: "Password must praise Albania in all caps (eg. password123ALBANIABEST)",
            success: false
        };
    }
    if (!isAppropriate(password)) {
        return {
            message: "Your password cannot reference Serbia",
            success: false
        };
    }

    const {data, error} = await supabase.from("users").insert({
        username: username,
        password: hash(password),
    }).select();

    if (error) {
        return {
            message: error.message,
            success: false
        };
    }
    return {
        message: data[0],
        success: true
    };
}
async function authenticate(username, password) {
    const {data, error} = await supabase.from("users").select().eq("username", username).eq("password", hash(password));

    if (error) {
        return {
            message: error.message,
            success: false
        };
    }
    else if (data.length == 0) {
        return {
            message: "Invalid credentials",
            success: false
        }
    }

    return {
        message: data[0],
        success: true
    };
}


async function createChat(username, password, name) {
    if (name.length < 4) {
        return {
            message: "Must be at least 4 characters long",
            success: false
        }
    }
    
    const auth = await authenticate(username, password);

    if (!auth.success) return auth;

    const uid = auth.message.id;
    let chats = auth.message.chats;

    const {data, error} = await supabase.from("chats").insert({
        name: name,
        invite: generateInvite(),
        members: [uid],
        moderators: [uid],
        owner: uid,
    }).select();

    // Append chat id to chat list
    if (chats) {
        chats.push(data[0].id);
    }
    else {
        chats = [data[0].id];
    }

    await supabase.from("users").update({
        chats: chats
    }).eq("id", uid);

    if (error) {
        return {
            message: error.message,
            success: false
        };
    }
    return {
        message: data[0],
        success: true
    };
}
async function getMessage(id) {
    let {data, error} = await supabase.from("messages").select().eq("id", id);

    if (error) {
        return {
            message: "Unable to fetch message",
            success: false
        };
    }
    else {
        let username = (await supabase.from("users").select("username").eq("id", data[0].user)).data[0].username;
        console.log(username);
        if (!username) {
            username = "[Deleted User]";
        }

        data[0].username = username;

        return {
            message: data[0],
            success: true
        };
    }
}
async function sendMessage(username, password, message, chat) {
    const auth = await authenticate(username, password);

    if (!auth.success) return auth;

    const uid = auth.message.id;

    let {data, error} = await supabase.from("messages").insert({
        user: uid,
        content: message
    }).select();

    const messageData = data[0];
    const mid = messageData.id;

    if (error) {
        return {
            message: error.message,
            success: false
        };
    }
    console.log(await supabase.from("chats").select("id").eq("id", chat));
    ({data, error} = await supabase.from("chats").update({
        messages: returnAppend(
            (await supabase.from("chats").select("messages").eq("id", chat)).data[0].messages, 
            mid)
    }).eq("id", chat));
    return {
        message: messageData,
        success: true
    };
}


// Routing

// app.get("/", (req, res) => {
//     res.render(getPublicFile("index.html"));
// });

app.post("/signon", async function(req, res) {
    let message = await authenticate(req.body.username, req.body.password);
    console.log(`Sign On: ${JSON.stringify(message)}`);
    res.json(message);
});
app.post("/createaccount", async function(req, res) {
    let message = await createAccount(req.body.username, req.body.password);
    console.log(`Create Account: ${JSON.stringify(message)}`);
    res.json(message);
});
app.post("/createchat", async function(req, res) {
    let message = await createChat(req.body.username, req.body.password, req.body.name);
    console.log(`Create Chat: ${JSON.stringify(message)}`);
    res.json(message);
});
app.post("/sendmessage", async function(req, res) {
    let message = await sendMessage(req.body.username, req.body.password, req.body.content, req.body.id);
    console.log(`Send message: ${JSON.stringify(message)}`);
    res.json(message);
});

app.post("/getchats", async function(req, res) {
    const {data, error} = await supabase.from("users").select("chats").eq("username", req.body.username).eq("password", hash(req.body.password));
    
    if (error) {
        res.json({
            message: "Unable to fetch chats",
            success: false
        });
    }
    else {
        let returnData = [];
        let rawChats = data[0].chats;

        if (rawChats == null) rawChats = [];
        
        for (let i = 0; i < rawChats.length; i++) {
            const id = rawChats[i];
            const name = (await supabase.from("chats").select("name").eq("id", id)).data[0].name;

            const newItem = { id: id, name: name };
            console.log(newItem);
            returnData.push(newItem);
        }
        res.json({
            message: returnData,
            success: true
        });
    }
});

app.post("/getmessages", async function(req, res) {
    const auth = await authenticate(req.body.username, req.body.password);

    if (!auth.success) {
        return {
            message: "Unable to authorize",
            success: false
        };
    }
    
    const {data, error} = await supabase.from("chats").select("messages").eq("id", req.body.id);

    if (error) {
        res.json({
            message: "Unable to fetch messages",
            success: false
        });
    }
    else {
        const messages = data[0].messages;
        let returnData = []
        if (messages == null) {
            res.json({
                message: "cope",
                success: false
            });
            return;
        }

        for (let i = 0; i < messages.length; i++) {
            const {message, success} = await getMessage(messages[i]);
            if (!success) continue

            returnData.push(message);
        }
        res.json({
            message: returnData,
            success: true
        });
    }
})


app.use(express.static("public"));

app.listen(8000);
