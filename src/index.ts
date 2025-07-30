import * as dotenv from 'dotenv';
import Snoowrap from 'snoowrap';
import OpenAI from 'openai';
import axios from 'axios';
import csv from 'csv-parser';
import fsPromises from 'fs/promises';
import fsSync from 'fs';
import * as crypto from 'crypto';
import * as stream from 'stream';

dotenv.config();

function encryptText(data: string, encryptionKey: string): string {
  const initializationVector = crypto.randomBytes(16);
  const hashedEncryptionKey = crypto
    .createHash('sha256')
    .update(encryptionKey)
    .digest('hex')
    .substring(0, 32);
  const cipher = crypto.createCipheriv('aes256', hashedEncryptionKey, initializationVector);
  const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
  return `${initializationVector.toString('hex')}:${encryptedData.toString('hex')}`;
}

function decryptText(encryptedData: string, encryptionKey: string): string {
  const [initializationVectorAsHex, encryptedDataAsHex] = encryptedData.split(':');
  const initializationVector = Buffer.from(initializationVectorAsHex, 'hex');
  const hashedEncryptionKey = crypto
    .createHash('sha256')
    .update(encryptionKey)
    .digest('hex')
    .substring(0, 32);
  const decipher = crypto.createDecipheriv('aes256', hashedEncryptionKey, initializationVector);
  const decryptedText = Buffer.concat([
    decipher.update(Buffer.from(encryptedDataAsHex, 'hex')),
    decipher.final(),
  ]);
  return decryptedText.toString();
}

let credentials: { clientId: string; clientSecret: string; refreshToken: string }[] = [];
const loadCredentials = new Promise<void>((resolve, reject) => {
  const encryptionKey = process.env.CREDENTIAL_KEY;
  if (!encryptionKey) {
    reject(new Error('CREDENTIAL_KEY environment variable is not set'));
    return;
  }
  fsPromises
    .readFile('reddit_credentials.csv', 'utf8')
    .then((encryptedContent) => {
      const decryptedContent = decryptText(encryptedContent, encryptionKey);
      const readable = new stream.Readable();
      readable._read = () => {};
      readable.push(decryptedContent);
      readable.push(null);
      readable
        .pipe(csv())
        .on('data', (row: { client_id: string; client_secret: string; refresh_token: string }) => {
          credentials.push({
            clientId: row.client_id,
            clientSecret: row.client_secret,
            refreshToken: row.refresh_token,
          });
        })
        .on('end', () => {
          console.log('Loaded', credentials.length, 'Reddit credentials');
          resolve();
        });
    })
    .catch((error) => {
      reject(error);
    });
});
await loadCredentials;
let currentCredentialIndex = 0;
const userAgent = process.env.REDDIT_USER_AGENT!;
if (credentials.length === 0) {
  throw new Error('No Reddit credentials loaded');
}
let reddit = new Snoowrap({
  userAgent,
  clientId: credentials[currentCredentialIndex].clientId,
  clientSecret: credentials[currentCredentialIndex].clientSecret,
  refreshToken: credentials[currentCredentialIndex].refreshToken,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
const aiProvider = process.env.AI_PROVIDER || 'gemini';

const subreddits = ['AmateurPorn', 'GOONED', 'porn', 'short_porn', 'Step_Fantasy_GIFs']; // Example subreddits
const upvoteThreshold = 100; // Threshold for high visibility

function replacePlaceHolders(text: string): string {
  return text
    .replace('{PlaceHolderSite}', 'https://freehqpornxxx.com/')
    .replace('{PlaceHolderText1}', 'hight quality porn');
}

async function generateComment(postTitle: string, postContent: string): Promise<string> {
  const prompt = `Generate a semantically meaningful comment for this Reddit post: Title: ${postTitle}, Content: ${postContent}. In the comment ask the users to visit {PlaceHolderSite} for free {PlaceHolderText1}, and only output one comment as your response, and nothing else!. And do not replace {PlaceHolderSite}, and {PlaceHolderText1} in the comment, just output the comment as it is.`;
  if (aiProvider === 'openai') {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates meaningful comments for Reddit posts.',
        },
        { role: 'user', content: prompt },
      ],
    });
    return completion.choices[0].message.content || 'No comment generated.';
  } else if (aiProvider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY!;
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const data = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };
    try {
      const response = await axios.post(`${url}?key=${apiKey}`, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        return (
          replacePlaceHolders(response.data.candidates[0].content.parts[0].text) ||
          'No comment generated.'
        );
      } else {
        console.log('Error calling Gemini API:', response.data);
        return 'No comment generated.';
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'Error generating comment.';
    }
  } else {
    throw new Error(`Unsupported AI provider: ${aiProvider}`);
  }
}

// Change progress type
interface PostProgress {
  id: string;
  title: string;
  url: string;
  commented: boolean;
  commentUrl?: string;
  comment?: string;
}

interface Progress {
  posts: PostProgress[];
  pagination: Record<string, string>;
}

interface GetHotOptions {
  limit?: number;
  after?: string;
}

let progress: Progress = { posts: [], pagination: {} };
let progressMap: Map<string, PostProgress> = new Map();
try {
  const progressData = await fsPromises.readFile('progress.json', 'utf8');
  const loaded = JSON.parse(progressData);
  if (Array.isArray(loaded)) {
    progress.posts = loaded;
  } else {
    progress = loaded as Progress;
  }
  progress.posts.forEach((p) => progressMap.set(p.id, p));
} catch (error: any) {
  if (error.code !== 'ENOENT') console.error('Error loading progress:', error);
}
// Function to save progress
async function saveProgress() {
  await fsPromises.writeFile('progress.json', JSON.stringify(progress));
}

function changeRedditAccount(redditAccountChangeCount: number, error: any) {
  console.log('Error commenting on post:', error);
  if (redditAccountChangeCount > credentials.length + 1) {
    console.log('No more reddit accounts to switch to');
    process.exit(0);
  }
  // Switch reddit account
  currentCredentialIndex = (currentCredentialIndex + 1) % credentials.length;
  console.log('Switching to reddit account:', currentCredentialIndex);
  reddit = new Snoowrap({
    userAgent,
    clientId: credentials[currentCredentialIndex].clientId,
    clientSecret: credentials[currentCredentialIndex].clientSecret,
    refreshToken: credentials[currentCredentialIndex].refreshToken,
  });
}

async function scanAndComment() {
  let redditAccountChangeCount = 0;
  let newCommentsAdded = 0;

  for (const subreddit of subreddits) {
    try {
      let after: string | undefined = progress.pagination[subreddit] ?? undefined;
      let options: GetHotOptions = { limit: 5 };
      if (after) {
        options.after = after;
      }
      console.log('options', options);
      const posts = await reddit.getSubreddit(subreddit).getHot(options);
      console.log('posts fetched', posts.length);
      for (const post of posts) {
        const postId = post.id;
        let postProg = progressMap.get(postId);
        if (postProg && postProg.commented) {
          console.log(`Skipping already commented post: ${post.title}`);
          continue;
        }
        if (!postProg) {
          postProg = { id: postId, title: post.title, url: post.url, commented: false };
          progress.posts.push(postProg);
          progressMap.set(postId, postProg);
          await saveProgress();
        }
        if (post.score > upvoteThreshold) {
          const comment = await generateComment(post.title, post.selftext);
          console.log('Commenting on post: ', post.title);
          console.log('Comment: ', comment);
          try {
            const replyComment = await (post as any).reply(comment);
            const commentUrl = `https://reddit.com${replyComment.permalink}`;
            postProg.commented = true;
            postProg.commentUrl = commentUrl;
            postProg.comment = comment;
            await saveProgress();
            console.log(`Commented on post: ${post.title}`);
            newCommentsAdded++;
            console.log('New comments added: ', newCommentsAdded);
          } catch (error) {
            changeRedditAccount(redditAccountChangeCount, error);
            redditAccountChangeCount++;
            await saveProgress();
          }
        }
      }
      if (posts.length > 0) {
        progress.pagination[subreddit] = posts[posts.length - 1].name;
      } else if (progress.pagination[subreddit]) {
        delete progress.pagination[subreddit];
      }
      await saveProgress();
    } catch (error) {
      changeRedditAccount(redditAccountChangeCount, error);
      redditAccountChangeCount++;
    }
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('SIGINT received. Saving progress...');
  await saveProgress();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Saving progress...');
  await saveProgress();
  process.exit(0);
});

scanAndComment().catch();
