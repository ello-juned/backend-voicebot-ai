const express = require("express");
const twilio = require("twilio");
const cors = require("cors");
const app = express();
const OpenAI = require("openai");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();
var userSpeech_question;
var phoneNumber;
const PORT = process.env.PORT || 5500;
// const apiKey = "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";

const openai = new OpenAI({
  apiKey: process.env.apiKey, // defaults to process.env["OPENAI_API_KEY"]
});

// const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Replace these with your Twilio Account SID and Auth Token
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));

// Initialize the Twilio client
const client = twilio(accountSid, authToken);

// // Create a route for voice interactions
// app.post("/", async (req, res) => {
//   const twiml = new twilio.twiml.VoiceResponse();
//   let phoneNumber; // Define phoneNumber within the route handler function scope

//   try {
//     console.log("api started!!, 1");

//     phoneNumber = req.body.phoneNumber;
//     console.log("phoneNumber", phoneNumber);
//     // Make a Twilio call
//     const call = await client.calls.create({
//       url: "https://76aa-2401-4900-3b36-4199-6837-a32e-42f1-cdcf.ngrok-free.app",
//       to: `+91 ${phoneNumber}`,
//       from: "+15038280821", // Update with your Twilio phone number
//     });

//     console.log(`Call SID: ${call.sid}`);

//     // Greet the user with a message using AWS Polly Neural voice
//     twiml.say(
//       "Hey! I'm Sophia from Ellocent Labs, What would you like to talk about today?"
//     );

//     // Listen to the user's speech and pass the input to the /respond endpoint
//     twiml.gather({
//       speechTimeout: "auto",
//       speechModel: "experimental_conversations",
//       input: "speech",
//       action: "/voice-chat/respond", // Send the collected input to /voice-chat/respond
//     });

//     // Return the response to Twilio
//     res.type("text/xml");
//     res.send(twiml.toString());
//   } catch (error) {
//     console.error(`Error making call: ${error.message}`);
//     res.status(500).json({ message: error.message });
//   }
// });

// Create a route for voice interactions

app.post("/", async (req, res) => {
  try {
    // console.log("api started!!, 1");

    const phone_Number = req?.body?.phoneNumber;
    if (phone_Number) {
      phoneNumber = phone_Number;
    }
    // phoneNumber = phone_Number;
    // console.log("phoneNumber", phoneNumber, typeof phoneNumber);
    // console.log("phone___Number", phone_Number, typeof phone_Number);

    // Make a Twilio call
    const call = await client.calls.create({
      url: "https://backend-voicebot-ai.onrender.com/voice-chat", // Replace with your actual URL
      to: `+91${phoneNumber}`,
      from: "+15038280821", // Update with your Twilio phone number
    });

    // console.log(`Call SID: ${call.sid}`);

    setTimeout(() => {
      if (call.sid) {
        res
          .status(200)
          .json({ message: "Call Connected sussessfully!", connection: true });
      }
    }, 6000);
  } catch (error) {
    // console.error(`Error making call: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

app.post("/voice-chat", async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  try {
    console.log("api started!!, 1");

    const phone_Number = req?.body?.phoneNumber;
    if (phone_Number) {
      phoneNumber = phone_Number;
    }
    // phoneNumber = phone_Number;
    console.log("phoneNumber", phoneNumber, typeof phoneNumber);
    console.log("phone___Number", phone_Number, typeof phone_Number);

    // Greet the user with a message
    twiml.say(
      "Hey! I'm Sophia from Ellocent Labs, What would you like to talk about today?"
    );

    // Listen to the user's speech and pass the input to the /voice-chat/respond endpoint
    twiml.gather({
      speechTimeout: "auto",
      speechModel: "experimental_conversations",
      input: "speech",
      action: "/voice-chat/respond", // Send the collected input to /voice-chat/respond
    });

    // Return the response to Twilio
    res.type("text/xml");
    res.send(twiml.toString());
  } catch (error) {
    console.error(`Error making call: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// Create a route for handling chatbot responses
app.post("/voice-chat/respond", (req, res) => {
  userSpeech_question = req?.body?.SpeechResult;

  const twiml = new twilio.twiml.VoiceResponse();

  if (userSpeech_question) {
    twiml.say(
      `You said: ${userSpeech_question}. Say "confirm" to proceed or "change" to provide a new input.`
    );
  }

  twiml.gather({
    speechTimeout: "auto",
    speechModel: "experimental_conversations",
    input: "speech",
    action: "/voice-chat/confirm-or-change-input",
  });

  // Return the response to Twilio
  res.type("text/xml");
  res.send(twiml.toString());
});

app.post("/voice-chat/confirm-or-change-input", async (req, res) => {
  const userSpeech_Confirmation = req.body.SpeechResult;
  const user_Speech = userSpeech_Confirmation?.replace(/\./g, "").toLowerCase();

  console.log("user_Speech", user_Speech);
  console.log("userSpeech_question", userSpeech_question);
  const twiml = new twilio.twiml.VoiceResponse();

  try {
    if (user_Speech === "confirm") {
      const result = await openai.chat.completions.create({
        messages: [{ role: "user", content: userSpeech_question }],
        model: "gpt-3.5-turbo",
      });

      // Handle the API result and log it
      const gpt_Result = result?.choices[0]?.message?.content || "";
      console.log(gpt_Result);

      // twiml.say(results);
      if (gpt_Result) {
        twiml.say(`here is your results, ${gpt_Result} `);

        // Return the response to Twilio
        res.type("text/xml");
        res.send(twiml.toString());
      }
    } else if (user_Speech === "change") {
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.redirect("/voice-chat"); // Allow the user to provide a new input
      res.type("text/xml");
      res.send(twiml.toString());
    } else {
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say("I didn't understand. Please say 'confirm' or 'change'");
      twiml.redirect("/voice-chat");
      res.type("text/xml");
      res.send(twiml.toString());
    }
  } catch (err) {
    // An error occurred, you can handle it here
    console.error(err);
    // Provide an error response if needed
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("An error occurred while processing your request.");
    res.type("text/xml");
    res.send(twiml.toString());
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
