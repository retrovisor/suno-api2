// testScript.js
const axios = require('axios');


// Simple logger
function log(message) {
  console.log(message);
}

// Point to your local Next.js server
const baseUrl = 'http://localhost:3000';

/**
 * 1. Make the "generate" call
 */
async function generateAudio() {
  log('Generating audio...');
  const url = `${baseUrl}/api/generate`;

  // Example payload – adjust as needed
  const payload = {
    prompt: 'My test prompt',
    make_instrumental: false,
    model: 'chirp-v3-5|chirp-v3-0',
    wait_audio: false,
  };

  try {
    log('Sending request with payload: ' + JSON.stringify(payload, null, 2));

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'json', // Expect a JSON response
    });

    log('Generation response received');
    log('Response status: ' + response.status);
    log('Response headers: ' + JSON.stringify(response.headers, null, 2));

    if (response.status !== 200) {
      throw new Error(`Failed to generate audio. Status: ${response.status}`);
    }

    const data = response.data;
    log('Response data: ' + JSON.stringify(data, null, 2));
    return data; // should be an array of objects with an "id" property
  } catch (error) {
    log('Error generating audio: ' + error.message);
    throw error;
  }
}

/**
 * 2. Fetch details of generated audio by IDs
 */
async function fetchAudioDetails(ids) {
  const url = `${baseUrl}/api/get?ids=${ids.join(',')}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'json',
    });

    log('Fetch response received');
    log('Response status: ' + response.status);
    log('Response headers: ' + JSON.stringify(response.headers, null, 2));

    if (response.status !== 200) {
      throw new Error(`Failed to fetch audio details. Status: ${response.status}`);
    }

    const data = response.data;
    log('Response data: ' + JSON.stringify(data, null, 2));
    return data; // should be an array of objects with an "audio_url" property
  } catch (error) {
    log('Error fetching audio details: ' + error.message);
    throw error;
  }
}

/**
 * 3. Poll until audio URLs are ready
 */
async function waitForAudioUrls(ids, maxRetries = 10, delay = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    log(`Polling attempt ${attempt}...`);
    const audioDetails = await fetchAudioDetails(ids);

    // Check if all audio files are ready
    const allCompleted = audioDetails.every(
      (audio) => audio.audio_url && audio.audio_url !== ''
    );

    if (allCompleted) {
      return audioDetails.map((audio) => audio.audio_url);
    }

    log(
      `Not all audio URLs are ready yet. Waiting ${delay / 1000} seconds before retrying...`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(
    'Failed to fetch audio URLs within the maximum retry limit.'
  );
}

/**
 * 4. Download audio file from a given URL
 */
async function downloadAudio(url) {
  try {
    log(`Downloading audio from URL: ${url}`);
    // Stream response so we can save it
    const response = await axios.get(url, {
      responseType: 'stream',
    });

    log('Audio stream started');

    // If you want to actually save to disk, un-comment and adjust:
    //
    // import fs from 'fs';  // (In ES modules you might need a top-level import)
    // const writer = fs.createWriteStream('my-audio.mp3');
    // response.data.pipe(writer);
    // return new Promise((resolve, reject) => {
    //   writer.on('finish', () => {
    //     log('Audio file saved successfully: my-audio.mp3');
    //     resolve('my-audio.mp3');
    //   });
    //   writer.on('error', reject);
    // });

    // Otherwise, just pretend we saved it somewhere:
    const savedPath = 'file://my-audio.mp3';
    log(`Audio file "saved" at: ${savedPath}`);
    return savedPath;
  } catch (error) {
    log(`Error downloading audio: ${error.message}`);
    throw error;
  }
}

/**
 * 5. Main driver
 */
async function main() {
  try {
    // Step A: Call /api/generate
    const generatedAudios = await generateAudio();
    log('Generation process completed');

    // Step B: Extract IDs from the response
    const ids = generatedAudios.map((audio) => audio.id);
    log('IDs: ' + JSON.stringify(ids));

    // Step C: Poll until audio URLs are ready
    log('Waiting for audio to be ready...');
    const audioUrls = await waitForAudioUrls(ids);

    log('Audio URLs retrieved: ' + JSON.stringify(audioUrls, null, 2));

    // Step D: Download the first audio file (optional)
    if (audioUrls[0]) {
      const downloadedFilePath = await downloadAudio(audioUrls[0]);
      log('Audio file downloaded successfully to ' + downloadedFilePath);
    } else {
      log('No audio URLs returned to download.');
    }
  } catch (error) {
    log('An error occurred in main: ' + error.message);
  }
}

// Execute the main function
main();

