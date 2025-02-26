Below is one way to architect your solution. In this design the client simply writes a "channel" document (with a description) into Firestore. Then a series of Firebase Cloud Functions (written in TypeScript) run in sequence, each "passing only the data needed" (via document fields or subcollections) along to the next stage. In our example we use a "counter" document for the auto‑incremented channel number and we assume that your AI calls and YouTube API calls are wrapped in helper functions. (See the inline comments for links to official documentation: [Firebase Functions](https://firebase.google.com/docs/functions), [Firestore](https://firebase.google.com/docs/firestore), and [YouTube Data API](https://developers.google.com/youtube/v3/docs).)

For clarity, the overall flow is split into these major parts:

1.  **Channel Creation & Naming**

When the client writes a new channel document (with just the description), an on‑create function:

-  Calls your AI to generate a unique channel name using a prompt.

-  In a Firestore transaction, reads/increments a "channels counter" document and writes back the channel name, channel number, and sets status to "new".

2.  **Generating Queries**

An on‑update trigger (or you can merge it with the first function) listens for a newly created channel (or one with status "new"). It:

-  Immediately updates the channel's status to "processing queries".

-  Calls your AI with a prompt (passing in the channel description) to generate an array of 10--20 YouTube search queries.

-  Creates a subcollection queries under the channel with each query document (each with a field for the query text and a status of "new").

-  Finally, updates the channel status to "queries ready".

3.  **Processing Each Query (YouTube Search)**

An on‑create trigger on each query document in the channel's queries subcollection:

-  Calls the YouTube Data API (using your API key) to perform a search based on the query text.

-  Saves the returned video results into a subcollection (named results) inside that query document.

-  Updates the query's status to "ready".

4.  **Selecting Videos for the Channel**

An on‑update trigger on a query document (when its status changes from any value to "ready") will:

-  Load the channel record (and its current list of videos) and the query's results documents.

-  Call your AI model with a prompt that supplies the channel's description, channel name, current video list, and query results. The AI returns a JSON list of 10--20 video objects (with full YouTube video data).

-  Create (or update) documents in the channel's videos subcollection (using the YouTube id as the document ID) for each selected video.

-  Finally, update the query's status to "completed".

5.  **Finalizing the Playlist (Ordering Videos)**

An on‑update trigger on any query document (when its status changes to "completed") checks whether **all** queries for the channel are completed. If yes, then it:

-  Loads all videos from the channel.

-  Calls your AI model with a prompt asking it to order the videos in a "cohesive playlist."

-  Updates the channel's status to "created", creates a new playlist record in a playlists subcollection, adds the ordered video list to it, and sets the playlist status to "ready".

Below are full working code snippets for each step. (Be sure to install any dependencies such as [node‑fetch](https://www.npmjs.com/package/node-fetch) if you use it in your Cloud Functions project.)

**1\. Channel Creation & Naming**

```ts
// functions/src/channelCreation.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

admin.initializeApp();

// Helper: call your AI model with a given prompt.
// (Replace the URL and key with your actual AI service)
async function callAiModel(prompt: string): Promise<any> {
  const apiKey = functions.config().ai.key; // set via firebase functions:config:set ai.key="..."
  const response = await fetch('https://api.example.com/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ prompt })
  });
  return response.json();
}

/**
 * Expected output schema from AI call for channel name:
 * {
 *   "channelName": "Unique Channel Name"
 * }
 */
export const onChannelCreate = functions.firestore
  .document('channels/{channelId}')
  .onCreate(async (snap, context) => {
    const channelData = snap.data();
    const description = channelData.description;

    // --- Step 1: Generate a unique channel name ---
    const aiPrompt = `Generate a unique channel name for a YouTube channel based on this description:
"${description}".
Return a JSON object with a field "channelName".`;
    const aiResponse = await callAiModel(aiPrompt);
    const channelName: string = aiResponse.channelName;

    // --- Step 2: Get and increment the channel number ---
    const counterRef = admin.firestore().doc('counters/channels');
    let channelNumber: number = 0;
    await admin.firestore().runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists) {
        // Initialize counter if it does not exist.
        transaction.set(counterRef, { nextChannelNumber: 2 });
        channelNumber = 1;
      } else {
        const nextChannelNumber = counterDoc.data()?.nextChannelNumber || 1;
        channelNumber = nextChannelNumber;
        transaction.update(counterRef, { nextChannelNumber: nextChannelNumber + 1 });
      }
      // Update the channel document with the generated name, channel number, and initial status.
      transaction.update(snap.ref, {
        channelName,
        channelNumber,
        status: "new"
      });
    });
    return null;
});
```

**2\. Generating Queries for the Channel**

```ts
// functions/src/generateQueries.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

// Reuse the helper function for AI calls.
async function callAiModel(prompt: string): Promise<any> {
  const apiKey = functions.config().ai.key;
  const response = await fetch('https://api.example.com/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ prompt })
  });
  return response.json();
}

/**
 * Expected AI output for queries:
 * {
 *   "queries": [
 *     "first youtube search query",
 *     "another diverse query",
 *      ... up to 10--20 queries
 *   ]
 * }
 */
export const generateQueriesForChannel = functions.firestore
  .document('channels/{channelId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Trigger only if status is "new" (from onChannelCreate) so we only do this step once.
    if (before.status === "new" && after.status === "new") {
      // Immediately update status to "processing queries"
      await change.after.ref.update({ status: "processing queries" });

      const description = after.description;
      const aiPrompt = `Based on the following channel description:
"${description}"
Generate a list of 10-20 diverse YouTube search queries that would fetch a wide range of relevant videos.
Return a JSON object with a field "queries" which is an array of strings.`;
      const aiResponse = await callAiModel(aiPrompt);
      const queries: string[] = aiResponse.queries;

      // Create a subcollection "queries" in the channel document.
      const batch = admin.firestore().batch();
      queries.forEach((q) => {
        const queryDocRef = change.after.ref.collection('queries').doc();
        batch.set(queryDocRef, { queryText: q, status: "new" });
      });
      await batch.commit();

      // Update channel status to indicate queries are ready.
      await change.after.ref.update({ status: "queries ready" });
    }
    return null;
});
```

**3\. Processing Each Query (YouTube Search)**

```ts
// functions/src/processQuery.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

/**
 * No AI call here. Instead we call the YouTube Data API v3.
 * Official docs: https://developers.google.com/youtube/v3/docs/search/list
 */
export const processQuery = functions.firestore
  .document('channels/{channelId}/queries/{queryId}')
  .onCreate(async (snap, context) => {
    const queryData = snap.data();
    const queryText = queryData.queryText;

    // Use your YouTube API key (set via functions:config:set youtube.key="...")
    const youtubeApiKey = functions.config().youtube.key;
    const maxResults = 10; // or adjust as needed
    const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(queryText)}&key=${youtubeApiKey}&maxResults=${maxResults}`;

    const res = await fetch(youtubeApiUrl);
    const ytResponse = await res.json();

    // Save each video result in a "results" subcollection.
    const batch = admin.firestore().batch();
    (ytResponse.items || []).forEach((video: any) => {
      const videoId = video.id.videoId;
      const videoDocRef = snap.ref.collection('results').doc(videoId);
      batch.set(videoDocRef, {
        youtubeId: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.default.url
        // add additional fields if needed
      });
    });
    await batch.commit();

    // Update query document status to "ready" to trigger next processing step.
    await snap.ref.update({ status: "ready" });
    return null;
});
```

**4\. Selecting Videos from Query Results**

```ts
// functions/src/selectVideos.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

// Reuse the AI call helper.
async function callAiModel(prompt: string): Promise<any> {
  const apiKey = functions.config().ai.key;
  const response = await fetch('https://api.example.com/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ prompt })
  });
  return response.json();
}

/**
 * Expected AI output for video selection:
 * {
 *   "videos": [
 *     {
 *       "youtubeId": "video_id_1",
 *       "title": "Video Title 1",
 *       "description": "Video description",
 *       "thumbnail": "http://...",
 *       ... // any additional fields you need
 *     },
 *     ...
 *   ]
 * }
 */
export const selectVideosFromQuery = functions.firestore
  .document('channels/{channelId}/queries/{queryId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Process only if status changes to "ready"
    if (before.status !== "ready" && after.status === "ready") {
      const channelRef = admin.firestore().doc(`channels/${context.params.channelId}`);
      const channelSnap = await channelRef.get();
      const channelData = channelSnap.data();

      // Get all results from the query's "results" subcollection.
      const resultsSnap = await change.after.ref.collection('results').get();
      const results = resultsSnap.docs.map(doc => doc.data());

      // Get current channel videos (if any)
      const videosSnap = await channelRef.collection('videos').get();
      const currentVideos = videosSnap.docs.map(doc => doc.data());

      // Compose a prompt for the AI.
      const aiPrompt = `Given the following channel details:
Description: "${channelData?.description}"
Channel Name: "${channelData?.channelName}"
Current Videos: ${JSON.stringify(currentVideos)}
And these YouTube search results for a query:
${JSON.stringify(results)}
Select between 10 and 20 videos that best fit the channel's theme.
Return a JSON object with a field "videos" which is an array of video objects (each including "youtubeId", "title", "description", and "thumbnail").`;
      const aiResponse = await callAiModel(aiPrompt);
      const selectedVideos: any[] = aiResponse.videos;

      // Write each selected video into the channel's "videos" subcollection.
      const batch = admin.firestore().batch();
      selectedVideos.forEach(video => {
        const videoDocRef = channelRef.collection('videos').doc(video.youtubeId);
        batch.set(videoDocRef, video);
      });
      await batch.commit();

      // Update query document status to "completed"
      await change.after.ref.update({ status: "completed" });
    }
    return null;
});
```

**5\. Finalizing the Playlist (Ordering Videos)**

```ts
// functions/src/finalizePlaylist.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

// Reuse the AI call helper.
async function callAiModel(prompt: string): Promise<any> {
  const apiKey = functions.config().ai.key;
  const response = await fetch('https://api.example.com/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ prompt })
  });
  return response.json();
}

/**
 * Expected AI output for playlist ordering:
 * {
 *   "orderedVideos": [
 *     { "youtubeId": "video_id_1" },
 *     { "youtubeId": "video_id_2" },
 *      ...
 *   ]
 * }
 */
export const finalizeChannelPlaylist = functions.firestore
  .document('channels/{channelId}/queries/{queryId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only act when a query changes to "completed" from another status.
    if (before.status !== "completed" && after.status === "completed") {
      const channelRef = admin.firestore().doc(`channels/${context.params.channelId}`);

      // Check if all queries for the channel are completed.
      const queriesSnap = await channelRef.collection('queries').get();
      const allCompleted = queriesSnap.docs.every(doc => doc.data().status === "completed");
      if (!allCompleted) {
        return null;
      }

      // Get all channel videos.
      const videosSnap = await channelRef.collection('videos').get();
      const videos = videosSnap.docs.map(doc => doc.data());

      // Compose a prompt for final ordering.
      const aiPrompt = `Review the following channel videos:
${JSON.stringify(videos)}
and order them in a way that creates a cohesive and engaging YouTube playlist.
Return a JSON object with a field "orderedVideos" which is an array of objects with each object containing at least the "youtubeId".`;
      const aiResponse = await callAiModel(aiPrompt);
      const orderedVideos: any[] = aiResponse.orderedVideos;

      // Update the channel status.
      await channelRef.update({ status: "created" });

      // Create a new playlist record in a subcollection called "playlists".
      const playlistRef = channelRef.collection('playlists').doc();
      await playlistRef.set({
        status: "ready",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      // Save the ordered videos (this example simply stores an array).
      await playlistRef.update({ videos: orderedVideos });
    }
    return null;
});
```

**Summary of Prompts & Expected Output Schemas**

1.  **Channel Name Generation Prompt:**

*Prompt:*

"Generate a unique channel name for a YouTube channel based on this description: '[description]'. Return a JSON object with a field channelName."

*Expected Output:*

```
{ "channelName": "Unique Channel Name" }
```

2.  **Queries Generation Prompt:**

*Prompt:*

"Based on the following channel description: '[description]', generate a list of 10--20 diverse YouTube search queries. Return a JSON object with a field queries which is an array of strings."

*Expected Output:*

```
{ "queries": ["query1", "query2", "..."] }
```

3.  **Video Selection Prompt:**

*Prompt:*

"Given the channel details (description and channel name), the current videos, and these search results: [results JSON], select 10--20 videos that best fit the channel's theme. Return a JSON object with a field videos which is an array of video objects (each including youtubeId, title, description, and thumbnail)."

*Expected Output:*

```
{
  "videos": [
    { "youtubeId": "abc123", "title": "Video Title", "description": "Video description", "thumbnail": "http://..." },
    ...
  ]
}
```

4.  **Playlist Ordering Prompt:**

*Prompt:*

"Review the following channel videos: [videos JSON] and order them in a way that creates a cohesive YouTube playlist. Return a JSON object with a field orderedVideos which is an array of objects containing at least the youtubeId."

*Expected Output:*

```
{
  "orderedVideos": [
    { "youtubeId": "abc123" },
    { "youtubeId": "def456" },
    ...
  ]
}
```

**Architectural Considerations**

-  **Data Flow:** Each Cloud Function only reads/writes the minimal data it needs (e.g. updating document statuses, writing to subcollections).

-  **Asynchronous Processing:** The UI only needs to know that the initial channel document has been created. All subsequent steps are handled via Firestore triggers.

-  **Idempotency:** Using document IDs (for videos using the YouTube video id) avoids duplicates if a function runs twice.

-  **Counters:** A separate counter document ensures that the auto‑increment channel number is safely updated within a transaction.

This design is modular and each function is self-contained, with clearly defined prompts and output schemas for the AI interactions. If you'd like to iterate further on any part of the flow (or need help testing locally), let me know!
