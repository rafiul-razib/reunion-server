const express = require("express");
const QRCode = require("qrcode");
const SSLCommerzPayment = require('sslcommerz-lts')
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
require("dotenv").config();




const ai = new GoogleGenerativeAI(process.env.AI_API_KEY);
app.use(cors({origin: ["http://localhost:3000","https://reunion-cpscm.vercel.app"]}));
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


    app.post("/chat", async (req, res) => {
    try {
    const query = req.body?.messages?.[0]?.content;

    if (!query) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("User query:", query);

    // ✅ Correct model usage
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
      temperature: 0.4,        // 👈 main creativity control
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 512,
  },
    });

    const prompt = `
      You are an AI-powered Event Assistant for the CPSCM Reunion Programme.

      Event Overview:
      - Event Name: CPSCM Grand Reunion 2025
      - Date: 6th January 2025
      - Venue: CPSCM Campus
      - Registration fee: 1700 taka per perticipant. BDT 1000 will be added for each guest. Children under 5 years needs no registration fee.

      Schedule:
      - Registration & Welcome Tea: 9:00 AM
      - Opening Ceremony: 10:00 AM
      - Lunch Break: 1:00 PM
      - Cultural Program: 2:30 PM
      - Closing Ceremony: 6:30 PM

      Rules:
      - Carry registration confirmation
      - Follow campus rules

      User Question:
      "${query}"

      Answer politely, clearly, and in a friendly celebratory tone. If the user asks in Bangla, reply in Bangla. Otherwise, reply in English. Maintain the flow of previous reply.
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

      res.send({ reply });
      
      // console.log(reply);

  } catch (error) {
    console.error("Gemini chat error →", error);
    res.status(500).json({
      reply:
        "Our event assistant is currently unavailable. Please visit the help desk near the main entrance.",
    });
  }
});



    

    // (Optional) Add member
    // app.post("/register", async (req, res) => {
    //   const tran_id = new ObjectId().toString();
    //   const payload = req.body
    //   // console.log(payload);
    //   const guests = req.body.guests;
    //   const amount = 1700 + guests * 1000;
    //   // console.log("price", amount);
      

    //   // SSLCommerz Init
    //   const data = {
    //     total_amount: amount,
    //     currency: 'BDT',
    //     tran_id: tran_id, // use unique tran_id for each api call
    //     success_url: `https://reunion-cpscm-server.vercel.app/payment/success/${tran_id}`,
    //     fail_url: `https://reunion-cpscm-server.vercel.app/payment/fail/${tran_id}`,
    //     cancel_url: 'https://reunion-cpscm-server.vercel.app/cancel',
    //     ipn_url: 'https://reunion-cpscm-server.vercel.app/ipn',
    //     shipping_method: 'Courier',
    //     product_name: 'CPSCM Reunion',
    //     product_category: 'Registration',
    //     product_profile: 'general',
    //     cus_name: payload.fullName,
    //     cus_email: payload.email,
    //     cus_add1: payload.address,
    //     cus_add2: 'Dhaka',
    //     cus_city: 'Dhaka',
    //     cus_state: 'Dhaka',
    //     cus_postcode: '1000',
    //     cus_country: 'Bangladesh',
    //     cus_phone: payload.phone,
    //     cus_fax: '01711111111',
    //     ship_name: 'Customer Name',
    //     ship_add1: 'Dhaka',
    //     ship_add2: 'Dhaka',
    //     ship_city: 'Dhaka',
    //     ship_state: 'Dhaka',
    //     ship_postcode: 1000,
    //     ship_country: 'Bangladesh',
    //   };
      
    //   // console.log(data);
    // const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
    // sslcz.init(data).then(async(apiResponse) => {
    //     // Redirect the user to payment gateway
    //     let GatewayPageURL = apiResponse.GatewayPageURL
      
    //   const finalOrder = {
    //     ...payload, totalAmount: amount, paymentStatus: false, transactionId: tran_id
    //   }

    //   const result = await allMembersCollection.insertOne(finalOrder);

    //   res.send({ url: GatewayPageURL })

    //     // console.log('Redirecting to: ', GatewayPageURL)
    // });
    // });

  app.post("/register", async (req, res) => {
  try {
    const tran_id = new ObjectId().toString();
    const payload = req.body;
    const guests = payload.guests;
    const amount = 1700 + guests * 1000;

    const data = {
      total_amount: amount,
      currency: "BDT",
      tran_id: tran_id,
      success_url: `https://reunion-cpscm-server.vercel.app/payment/success/${tran_id}`,
      fail_url: `https://reunion-cpscm-server.vercel.app/payment/fail/${tran_id}`,
      cancel_url: "https://reunion-cpscm-server.vercel.app/cancel",
      ipn_url: "https://reunion-cpscm-server.vercel.app/ipn",
      shipping_method: "Courier",
      product_name: "CPSCM Reunion",
      product_category: "Registration",
      product_profile: "general",
      cus_name: payload.fullName,
      cus_email: payload.email,
      cus_add1: payload.address,
      cus_add2: "Dhaka",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: payload.phone,
      cus_fax: "01711111111",
      ship_name: "Customer Name",
      ship_add1: "Dhaka",
      ship_add2: "Dhaka",
      ship_city: "Dhaka",
      ship_state: "Dhaka",
      ship_postcode: 1000,
      ship_country: "Bangladesh",
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

    const apiResponse = await sslcz.init(data);
    const GatewayPageURL = apiResponse.GatewayPageURL;

    const finalOrder = {
      ...payload,
      totalAmount: amount,
      paymentStatus: false,
      transactionId: tran_id,
    };

    // INSERT BEFORE SENDING RESPONSE
    const result = await allMembersCollection.insertOne(finalOrder);
    console.log("Inserted →", result.insertedId);

    // NOW send response
    return res.send({ url: GatewayPageURL });

  } catch (error) {
    console.error("Register error →", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



    

    app.post("/payment/success/:tran_id", async (req, res) => {

      // console.log("Transaction Id: ", req.params.tran_id);
      
      const result = await allMembersCollection.updateOne({ transactionId: req.params.tran_id }, {
        $set: {
          paymentStatus: true
        }
      })

            // After you get tran_id
      

      const verifyURL = `https://reunion-cpscm.vercel.app/verifyUser/${req.params.tran_id}`;
      const qrImageURL = await QRCode.toDataURL(verifyURL);

      if (result.modifiedCount > 0) {
              // Get user data to send email
          const user = await allMembersCollection.findOne({ transactionId: req.params.tran_id });

          // Send confirmation email
          await sendConfirmationEmail(user.email, user.fullName, req.params.tran_id, qrImageURL);

          // Redirect

        res.redirect(`https://reunion-cpscm.vercel.app/paymentConfirmation/success/${req.params.tran_id}`)

      }

    })

  app.all("/payment/fail/:tran_id", async (req, res) => {
  try {
    // const tranId = req.params.tran_id;

    console.log("Trying to delete transactionId:", req.params.tran_id);


    const result = await allMembersCollection.deleteOne({ transactionId: req.params.tran_id });
    console.log(result);

    if (result.deletedCount) {
      return res.redirect(`https://reunion-cpscm.vercel.app/paymentConfirmation/fail/${req.params.tran_id}`);
    }

    return res.status(404).json({ message: "Transaction not found." });

  } catch (error) {
    console.error("Payment fail route error →", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

    

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
