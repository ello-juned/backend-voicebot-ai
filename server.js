const express = require("express");
const twilio = require("twilio");
const cors = require("cors");
const app = express();
const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

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
// Initialize the Twilio client
const client = twilio(accountSid, authToken);

// Create a route for voice interactions
app.post("/", (req, res) => {
  console.log("api started!!");

  const phoneNumber = req.body.phoneNumber;

  // Make a Twilio call
  client.calls
    .create({
      url: "https://backend-voicebot-ai.onrender.com/",
      to: `+91 ${phoneNumber}`,
      from: "+15038280821", // Update with your Twilio phone number
    })
    .then((call) => console.log(`Call SID: ${call.sid}`))
    .catch((error) => {
      // console.error(`Error making call: ${error.message}`);
      // res.status(401).json({ message: error.message });
    });

  const twiml = new twilio.twiml.VoiceResponse();

  // Greet the user with a message using AWS Polly Neural voice
  twiml.say(
    "Hey! I'm Sophia from Ellocent Labs, What would you like to talk about today?"
  );

  // Listen to the user's speech and pass the input to the /respond endpoint
  twiml.gather({
    speechTimeout: "auto",
    speechModel: "experimental_conversations",
    input: "speech",
    action: "/voice-chat/respond", // Send the collected input to /voice-chat/respond
  });

  // Return the response to Twilio
  res.type("text/xml");
  res.send(twiml.toString());
});

var userSpeech_question;

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
  const twiml = new twilio.twiml.VoiceResponse();

  const user_Speech = userSpeech_Confirmation?.replace(/\./g, "").toLowerCase();

  console.log("user_Speech", user_Speech);
  if (user_Speech === "confirm") {
    twiml.say(
      "Great! Let's proceed. Please wait while we are processing your request."
    );

    try {
      const result = await openai.chat.completions.create({
        messages: [{ role: "user", content: userSpeech_question }],
        model: "gpt-3.5-turbo",
      });

      // Handle the API result and log it
      const results = result?.choices[0]?.message?.content || "";
      // console.log("results", results, typeof results);

      if (results !== "") {
        twiml.say(`${results}`);
      } else {
        // If no response from GPT, handle it or provide a fallback response
        twiml.say(
          "I'm sorry, but I couldn't generate a response at the moment."
        );
      }
    } catch (err) {
      // An error occurred, you can handle it here
      console.error(err);
      // Provide an error response if needed
      twiml.say("An error occurred while processing your request.");
    }

    res.type("text/xml");
    res.send(twiml.toString());
  } else if (user_Speech === "change") {
    twiml.redirect("/"); // Allow the user to provide a new input
    res.type("text/xml");
    res.send(twiml.toString());
  } else {
    twiml.say("I didn't understand. Please say 'confirm' or 'change'");
    twiml.redirect("/voice-chat/respond");
    res.type("text/xml");
    res.send(twiml.toString());
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
