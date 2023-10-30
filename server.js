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

const openai = new OpenAI({
  apiKey: process.env.apiKey,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const accountSid = process.env.accountSid;
const authToken = process.env.authToken;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));

// Initialize the Twilio client
const client = twilio(accountSid, authToken);

app.post("/", async (req, res) => {
  console.log(" in /");
  try {
    const phone_Number = req?.body?.phoneNumber;
    if (phone_Number) {
      phoneNumber = phone_Number;
    }

    // Make a Twilio call
    const call = await client.calls.create({
      url: `${process.env.SERVER_URL}/voice-chat`,
      to: `+91${phoneNumber}`,
      from: `${process.env.callFrom}`,
    });

    setTimeout(() => {
      if (call.sid) {
        res
          .status(200)
          .json({ message: "Call Connected sussessfully!", connection: true });
      }
    }, 6000);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/voice-chat", async (req, res) => {
  console.log(" in /voice-chat");

  const twiml = new twilio.twiml.VoiceResponse();

  try {
    const phone_Number = req?.body?.phoneNumber;
    if (phone_Number) {
      phoneNumber = phone_Number;
    }

    // Greet the user with a message
    twiml.say(
      "Hey! I'm Sophia from Ellocent Labs, What would you like to talk about today?"
    );

    // Listen to the user's speech and pass the input to the /voice-chat/respond endpoint
    twiml.gather({
      speechTimeout: "auto",
      speechModel: "experimental_conversations",
      input: "speech",
      action: "/voice-chat/thanku", // Send the collected input to /voice-chat/respond
    });

    // Return the response to Twilio
    res.type("text/xml");
    res.send(twiml.toString());
  } catch (error) {
    console.error(`Error making call: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

app.post("/voice-chat/thanku", async (req, res) => {
  console.log("in /voice-chat/thanku");

  try {
    const userSpeech_Confirmation = req.body.SpeechResult;
    console.log("userSpeech_Confirmation", userSpeech_Confirmation);
    // Create a TwiML response object
    const twiml = new twilio.twiml.VoiceResponse();

    // Play the "Please wait" message
    twiml.say("Please wait while we process your request.", {
      voice: "woman", // You can set the desired voice here
    });

    // Process the chat GPT request
    const result = await openai.chat.completions.create({
      messages: [{ role: "user", content: userSpeech_Confirmation }],
      model: "gpt-3.5-turbo",
    });

    // Handle the API result and log it
    const gpt_Result = result?.choices[0]?.message?.content || "";

    if (gpt_Result) {
      console.log("gpt_Result", gpt_Result);

      // Create a new TwiML response for the GPT response
      const twimlResponse = new twilio.twiml.VoiceResponse();

      // Say the GPT response
      twimlResponse.say(`Here is your result: ${gpt_Result}`);

      // Return the GPT response to Twilio
      res.type("text/xml");
      res.send(twimlResponse.toString());
    } else {
      // If there's no GPT response, redirect to the /voice-chat/thanku route to check again
      twiml.redirect("/voice-chat/thanku");
      res.type("text/xml");
      res.send(twiml.toString());
    }
  } catch (err) {
    console.error(err);
    // If there is an error, handle it and respond accordingly
    const twimlError = new twilio.twiml.VoiceResponse();
    twimlError.say("An error occurred while processing your request.");
    res.type("text/xml");
    res.send(twimlError.toString());
  }
});

// app running port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
