# Node.js Application README

## Getting Started

To run this Node.js application, follow these steps:

### 1. Clone the Repository

Start by cloning this repository to your local machine:

### 2. Configure Environment Variables

Create a `.env` file in the root directory of your project and set the following environment variables:

```plaintext
PORT=3000
apiKey=YOUR_API_KEY                                 # Replace with your ChatGPT API key
accountSid=YOUR_ACCOUNT_SID                         # Replace with your Twilio account SID
authToken=YOUR_AUTH_TOKEN                           # Replace with your Twilio authentication token
callFrom=YOUR_PHONE_NUMBER FROM Twilio console      # Replace with your Twilio authentication token
SERVER_URL=YOUR_SERVER_URL                           # Use the appropriate URL, whether localhost or a live deployment
```

Replace the placeholders with your specific configuration.

### 3. Install Dependencies

Next, install the project's dependencies using npm:

```bash
npm install
```

### 4. Start the Application

You can now start the application:

```bash
npm run dev
```

\*Note---

# either use ngrok as proxy, or first deploy in the cloud.

# In your Twilio account, set live URL as the webhook for incoming calls.
