const express = require('express');
const cors = require('cors')
const jwt =require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port =process.env.PORT || 5000;



app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.btldh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res,next){

const  authHeader =req.headers.authorization;
if(!authHeader){
  return res.status(401).send({message:'UnAuthorized access'})
}
const token =authHeader.split(' ')[1];
jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
  if(err){
    return res.status(403).send({message:'Forbidden Access'})
  }
  // console.log(decoded) // bar
  req.decoded=decoded;
  next();
});
}

async function run(){
    try{
        await client.connect();
        console.log('database connected with mongodab');
        const serviceCollection =client.db('doctor_portal').collection('services');
        const bookingCollection =client.db('doctor_portal').collection('bookings');
        const userCollection =client.db('doctor_portal').collection('users');

      
        //data loadidng
        app.get('/services',async(req,res)=>{
            const query ='';
            const cursor =serviceCollection.find(query).project({name:1,});
            const services =await cursor.toArray();
            res.send(services);
        });


        app.get('/user',verifyJWT, async(req,res)=>{
          const user=await userCollection.find().toArray();
          res.send(user);
        });

        app.get('/admin/:email',async(req,res)=>{
          const email=req.params.email;
          const user = await userCollection.findOne({email:email});
          const isAdmin = user.role==="admin";
          res.send({admin:isAdmin})
        })

        app.put('/user/admin/:email', verifyJWT, async(req,res)=>{
          const email=req.params.email;
          const requester =req.decoded.email;
         const requesterAccounter =await userCollection.findOne({email:requester});
          if(requesterAccounter.role==='admin'){
            const filter ={email:email}; 
            const updateDoc = {
              $set: {role: 'admin'},
            };
            const result =await userCollection.updateOne(filter,updateDoc);
            res.send({result});
          }
          else{
            res.status(403).send({message:'forbidden'});
          }
   
        });

        app.put('/user/:email',async(req,res)=>{
          const email=req.params.email;
          const user =req.body;
          const filter ={email:email};
          const option ={upsert: true};
          const updateDoc = {
            $set: user,
          };
          const result =await userCollection.updateOne(filter,updateDoc,option);
          const token =jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1h'})
          res.send({result,token});
        });
          //data inserting
        //api naming convention
        /**
         * app.get('/booking)//get all booking in this collection or dget more than one or by filtering
         * app.get('/booking/:id)//get a specific id
         * app.post('/booking)// add a new booking 
         * app.pot(booking/id) user jodi thake take update kore dibo  upsert update (if exist) insert (if doesnot exist)
         * app.delete('/booking/:id')// updating one 
         */





        //this is not the proper way to query 
        // after learning more about mongodb user aggregate lookup ,pipeline 
        app.get('/available', async(req, res) =>{
          const date = req.query.date ;
          console.log(date)
    
          // step 1:  get all services
          const services = await serviceCollection.find().toArray();
          
          // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
          const query = {date: date};
          const bookings = await bookingCollection.find(query).toArray();
          
          // step 3: for each service
          services.forEach(service=>{
            // step 4: find bookings for that service. output: [{}, {}, {}, {}]
            const serviceBookings = bookings.filter(book => book.treatment === service.name);
            console.log(serviceBookings);
            // step 5: select slots for the service Bookings: ['', '', '', '']
            const booked = serviceBookings.map(book => book.slot);
            // step 6: select those slots that are not in bookedSlots
            const available = service.slots.filter(slot => !booked.includes(slot));
            
            //step 7: set available to slots to make it easier 
            service.slots = available;
          });
         
    
          res.send(services);
        })



        app.get('/booking',verifyJWT, async(req,res)=>{
          const patient=req.query.patient;
          const decodedEmail =req.decoded.email;
          if(patient===decodedEmail){
            const query = {patient: patient};
            const bookings = await bookingCollection.find(query).toArray();
           return res.send(bookings);
          }
          else{
            return res.status(403).send({message:'forbidden access'});
          }
         
          
        })





        app.post('/booking',async(req,res)=>{
          const booking=req.body;
          const query ={treatment:booking.treatment ,date:booking.date,patient:booking.patient}
          const exists= await bookingCollection.findOne(query);
          if(exists){
            return res.send({success:false,booking:exists})
          }
          const result = await bookingCollection.insertOne(booking);
          return  res.send({success:true, result});
        })

        




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