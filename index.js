const express = require("express");
const QRCode = require("qrcode");
const SSLCommerzPayment = require('sslcommerz-lts')
const cors = require("cors");
const app = express();
require("dotenv").config();




app.use(cors({origin: ["http://localhost:3000","https://reunion-cpscm.web.app", "https://reunion-cpscm.firebaseapp.com", "https://reunion-cpscm.vercel.app"]}));
app.use(express.json());

const port = process.env.PORT || 5000;

// MongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { sendConfirmationEmail } = require("./emailService");

const uri = process.env.URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASS
const is_live = false //true for live, false for sandbox

async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    // console.log("Connected to MongoDB!");

    const database = client.db("reunionCpscmDb");
    const allMembersCollection = database.collection("allMembers");

    // ---------------------------
    //         ROUTES
    // ---------------------------

    // Fetch all registered members
    app.get("/allRegisteredMembers", async (req, res) => {
      try {
        const result = await allMembersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Error fetching members" });
      }
    });


    

    // (Optional) Add member
    app.post("/register", async (req, res) => {
      const tran_id = new ObjectId().toString();
      const payload = req.body
      console.log(payload);
      const guests = req.body.guests;
      const amount = 1700 + guests * 1000;
      console.log("price", amount);
      

      // SSLCommerz Init
      const data = {
        total_amount: amount,
        currency: 'BDT',
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `https://reunion-cpscm-server.vercel.app/payment/success/${tran_id}`,
        fail_url: 'https://reunion-cpscm-server.vercel.app/fail',
        cancel_url: 'https://reunion-cpscm-server.vercel.app/cancel',
        ipn_url: 'https://reunion-cpscm-server.vercel.app/ipn',
        shipping_method: 'Courier',
        product_name: 'CPSCM Reunion',
        product_category: 'Registration',
        product_profile: 'general',
        cus_name: payload.fullName,
        cus_email: payload.email,
        cus_add1: payload.address,
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: payload.phone,
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
      };
      
      console.log(data);
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
    sslcz.init(data).then(async(apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
      res.send({ url: GatewayPageURL })
      const finalOrder = {
        ...payload, totalAmount: amount, paymentStatus: false, transactionId: tran_id
      }

      const result = await allMembersCollection.insertOne(finalOrder);

        console.log('Redirecting to: ', GatewayPageURL)
    });
    });

    app.post("/payment/success/:tran_id", async (req, res) => {

      

      console.log("Transaction Id: ", req.params.tran_id);
      
      const result = await allMembersCollection.updateOne({ transactionId: req.params.tran_id }, {
        $set: {
          paymentStatus: true
        }
      })

  

      // After you get tran_id
      

      const verifyURL = `https://reunion-cpscm.vercel.app/verifyUser/${req.params.tran_id}`;
      const qrImageURL = await QRCode.toDataURL(verifyURL);

      // console.log("qrImgURL",qrImageURL);



      if (result.modifiedCount > 0) {
              // Get user data to send email
          const user = await allMembersCollection.findOne({ transactionId: req.params.tran_id });

          // Send confirmation email
          await sendConfirmationEmail(user.email, user.fullName, req.params.tran_id, qrImageURL);

          // Redirect

        res.redirect(`https://reunion-cpscm.vercel.app/paymentConfirmation/success/${req.params.tran_id}`)

}

    })


    app.get("/verifyUser/:transactionId", async (req, res) => {
      const transId = req.params.transactionId;
      const result = await allMembersCollection.findOne({ transactionId: transId })
      res.send(result)
    })

  } finally {
    // keeping the connection open for server lifetime
  }
}

run().catch(console.dir);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Reunion Server is Running!!");
});

// Run server
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
