const express = require('express');
const path = require('path');
const script = require('./server/functions/script');

const gameRoutes = require('./server/routes/game');

const app = express();

app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());

app.use('/api',gameRoutes);

script.GenerateDeck();
script.ShuffleDeck();

app.listen(3000,()=>{
    console.log("Listening on port http://localhost:3000");
})
