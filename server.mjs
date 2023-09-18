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

const bannedWords = ["izbica", "izbice", "serb", "yugoslav", "milosevic", "slobodan", "radovan", "karadzic", "ratko", "biljana", "biljana", "plavsic"]

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

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

    const {data, error} = await supabase.from("users").insert({
        username: username,
        password: hash(password),
    }).select();

    if (error) {
        return {
            message: error,
            success: false
        };
    }
    return {
        message: data[0],
        success: true
    };
}
async function authenticate(username, password) {
    const {data, error} = await supabase.from("users").select().eq("username", username);

    if (error) {
        return {
            message: error,
            success: false
        };
    }
    else if (data.length == 0) {
        return {
            message: "User doesn't exist",
            success: false
        }
    }

    return {
        message: data[0],
        success: true
    };
}


async function createChat(username, password, name) {
    const authMessage = await authenticate(username, password);

    if (!authMessage.success) return authMessage;

    const uid = authMessage.data["id"];

    const {data, error} = await supabase.from("chats").insert({
        name: name,
        members: [uid],
        moderators: [uid],
        owner: uid,
    }).select();

    if (error) {
        return {
            message: error,
            success: false
        };
    }
    return {
        message: data[0],
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
    res.json(message);
});

app.use(express.static("public"));

app.listen(8000);
