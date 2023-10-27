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
    console.error(err);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("An error occurred while processing your request.");
    res.type("text/xml");
    res.send(twiml.toString());
  }
});

// app running port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
