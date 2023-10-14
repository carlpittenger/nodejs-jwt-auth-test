import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// import { json } from "body-parser";
import bodyParser from "body-parser";
const { json, urlencoded } = bodyParser;

// import { sign } from "jsonwebtoken";
import jwt from "jsonwebtoken";
const { sign } = jwt;

import { expressjwt as expressJwt } from "express-jwt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;
// const SECRET_KEY = process.env.SECRET;
const SECRET_KEY = "My super secret key";

const users = [
    { id: 1, username: "john", password: "123" },
    { id: 2, username: "smith", password: "456" },
];

const app = express();

const jwtMw = expressJwt({ secret: SECRET_KEY, algorithms: ["HS256"] });

function main() {
    app.use((_request, res, next) => {
        res.setHeader(
            "Access-Control-Allow-Origin",
            `http://localhost:${PORT}`,
        );
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-type,Authorization",
        );

        next();
    });

    app.use(json(), urlencoded({ extended: true }));

    app.get("/", (_request, res) => {
        res.sendFile(join(__dirname, "index.html"));
    });

    app.post("/api/login", (request, res) => {
        const { username, password } = request.body;

        for (const user of users) {
            if (username === user.username && password === user.password) {
                const token = sign({ id: user.id, username }, SECRET_KEY, {
                    expiresIn: "3m",
                });
                res.json({ success: true, token, err: null });
                return;
            }
        }

        res.status(401).json({
            success: false,
            token: null,
            err: "Username or password is incorrect",
        });
    });

    app.get("/api/dashboard", jwtMw, (_request, res) => {
        res.json({
            success: true,
            myContent: "Secret content that only logged in people can see.",
        });
    });

    app.get("/api/settings", jwtMw, (_request, res) => {
        res.json({
            success: true,
            myContent:
                "Settings page content. This route is protected with JWT.",
        });
    });

    app.get("/api/prices", jwtMw, (_request, res) => {
        res.json({
            success: true,
            myContent: "The price is: $3.99",
        });
    });

    app.use((err, _request, res, next) => {
        if (err.name === "UnauthorizedError") {
            res.status(401).json({
                success: false,
                officialErr: err,
                err: "Username or password is incorrect 2",
            });
            return;
        }
        next(err);
    });

    app.listen(PORT, () => {
        console.log(`serving at http://localhost:${PORT}`);
    });
}

main();
