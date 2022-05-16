const express = require('express');
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port =process.env.PORT || 5000;



app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.btldh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        console.log('database connected with mongodab');
        const serviceCollection =client.db('doctor_portal').collection('services');
        const bookingCollection =client.db('doctor_portal').collection('bookings');

      
        //data loadidng
        app.get('/services',async(req,res)=>{
            const query ='';
            const cursor =serviceCollection.find(query);
            const services =await cursor.toArray();
            res.send(services);
        });


          //data inserting
        //api naming convention
        /**
         * app.get('/booking)//get all booking in this collection or dget more than one or by filtering
         * app.get('/booking/:id)//get a specific id
         * app.post('/booking)// add a new booking 
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