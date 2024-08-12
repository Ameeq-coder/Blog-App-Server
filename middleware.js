// middleware.js
const jwt = require("jsonwebtoken");
const config = require("./config");

const checkToken = (req, res, next) => {
    let token = req.headers["authorization"];
    
    console.log(token);

    if (token) {
        if (token.startsWith("Bearer ")) {
            token = token.slice(7, token.length);
        }

        jwt.verify(token, config.key, (err, decoded) => {
            if (err) {
                return res.json({
                    status: false,
                    msg: "Token is invalid"
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.json({
            status: false,
            msg: "Token is not provided"
        });
    }
};

module.exports = {
    checkToken
};
