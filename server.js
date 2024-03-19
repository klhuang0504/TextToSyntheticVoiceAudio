const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const cors = require('cors');

const app = express();
const port = 3000;

const openai = new OpenAI(process.env.OPENAI_API_KEY); // Replace with your OpenAI API key

// Middleware to parse JSON bodies
app.use(bodyParser.json());
// CORS middleware to allow requests from specific origins
app.use(cors({ origin: 'http://localhost:8081' })); // Adjust origin as needed

// Endpoint to handle text upload and convert to speech
app.post('/convertToSpeech', async (req, res) => {
  try {
    const { texts } = req.body;
    console.log(texts)

    // Check if texts are provided
    if (!texts) {
      return res.status(400).json({ error: 'Texts array is required' });
    }

    const mp3s = await Promise.all([texts].map(async ({ text, voice }) => {
      console.log(text)
      console.log(voice)

      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: text,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    }));

    // const mp3s = texts.map(({ text, voice }) => {
    //   const mp3 = openai.audio.speech.create({
    //     model: 'tts-1',
    //     voice,
    //     input: text,
    //   });
    //   console.log(mp3)
    //   const buffer = Buffer.from(mp3.audio.data);
    //   return buffer;
    // });

    const combinedBuffer = Buffer.concat(mp3s);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(combinedBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
