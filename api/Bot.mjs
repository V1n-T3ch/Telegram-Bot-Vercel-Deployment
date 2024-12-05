import fetch from 'node-fetch';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const forwardChatIds = process.env.FORWARD_CHAT_IDS.split(',');

let lastMessageId = null;

const getUpdates = async () => {
  const url = `https://api.telegram.org/bot${token}/getUpdates`;

  try {
    console.log("Getting Updates...");
    const response = await fetch(url);
    console.log("Fetched Updates...");
    const data = await response.json();

    if (data.ok && data.result) {
      // Find the latest message in the private chat
      const latestMessage = data.result
        .filter(
          (update) =>
            update.message && update.message.chat.type === 'private'
        )
        .map((update) => update.message)
        .sort((a, b) => b.date - a.date)[0];

      if (latestMessage && latestMessage.message_id !== lastMessageId) {
        lastMessageId = latestMessage.message_id;

        // Forward the message immediately
        await forwardMessage(latestMessage.chat.id, latestMessage.message_id);
      }
    }
  } catch (error) {
    console.error('Error fetching updates:', error);
  }
};

const forwardMessage = async (fromChatId, messageId) => {
  const url = `https://api.telegram.org/bot${token}/forwardMessage`;

  try {
    for (const chatId of forwardChatIds) {
      const response = await axios.post(url, {
        chat_id: chatId,
        from_chat_id: fromChatId,
        message_id: messageId,
      });
      console.log('Message forwarded to group:', chatId, response.data);
    }
  } catch (error) {
    console.error('Error forwarding message:', error);
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await getUpdates();
    res.status(200).send('Polling complete.');
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
