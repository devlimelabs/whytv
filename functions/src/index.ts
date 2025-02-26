/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import * as admin from 'firebase-admin';


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
admin.initializeApp();

// Export Firebase Cloud Functions
export {onChannelCreate} from './channelCreation';
export {generateChannelQueries} from './generateQueries';
export {processYouTubeQuery} from './processQueries';
export {selectVideosForChannel} from './selectVideos';
export {finalizeChannelPlaylist} from './finalizePlaylist';
export {updateChannelStatus} from './updateChannelStatus';
