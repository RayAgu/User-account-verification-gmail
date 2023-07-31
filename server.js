require('./config/dbConfig');
const express = require('express');
const userRouter = require("./routers/userRouter")
const recordRouter = require("./routers/recordRouter")

const app = express();
const PORT = (process.env.PORT);
app.use( express.json() )
app.get( "/test", (req, res) => {
    res.send("User Account verification")
});

app.use( '/api', userRouter);
app.use( "/api", recordRouter )
app.listen( PORT, () => {
    console.log(`server is listening to port: ${PORT}`)
})