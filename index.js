const express = require('express');
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, MongoRuntimeError } = require('mongodb');
const app = express();
const port =process.env.PORT || 5000;



app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.btldh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        console.log('database connected with mongodab')
    }
    finally{

    }

}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello FROM DOCTOR UNCLE!')
})

app.listen(port, () => {
  console.log(`doctors app listening on port ${port}`)
})