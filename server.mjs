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
    const {data, error} = await supabase.from("users").select().eq("username", username).eq("password", hash(password));

    if (error) {
        return {
            message: error,
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
    const auth = await authenticate(username, password);

    if (!auth.success) return auth;

    const uid = auth.message.id;

    const {data, error} = await supabase.from("chats").insert({
        name: name,
        invite: generateInvite(),
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
    console.log(`Create Account: ${JSON.stringify(message)}`);
    res.json(message);
});
app.post("/createchat", async function(req, res) {
    let message = await createChat(req.body.username, req.body.password, req.res.name);
    console.log(`Create Chat: ${JSON.stringify(message)}`);
    res.json(message);
});

app.use(express.static("public"));

app.listen(8000);
