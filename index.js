const express = require('express');
const app = express();

app.use(express.json());

// Store notifications in memory (use a database for production)
let notifications = [];

// Webhook endpoint to receive POST requests from Roblox
app.post('/webhook', (req, res) => {
  const payload = req.body;
  console.log('Received webhook:', payload);

  // Extract data from the webhook message
  const content = payload.content || '';
  const placeIdMatch = content.match(/teleportService:TeleportToPlaceInstance`\("(\d+)", "([a-f0-9-]+)"/);
  if (placeIdMatch) {
    const placeId = placeIdMatch[1];
    const jobId = placeIdMatch[2];
    const gameName = content.match(/\*\*Game:\*\* (.*?)\n/)?.[1] || 'Unknown';
    const modelName = content.match(/\*\*Model Name:\*\* "(.*?)"\n/)?.[1] || 'Unknown';
    const mutation = content.match(/\*\*Mutation:\*\* (.*?)\n/)?.[1] || 'Unknown';
    const moneyText = content.match(/\*\*Money\/s:\*\* (.*?)\n/)?.[1] || 'N/A';
    const playerCount = content.match(/\*\*Player Count:\*\* (\d+)\/8/)?.[1] || '0';

    // Store the notification
    notifications.push({
      gameName,
      placeId,
      jobId,
      modelName,
      mutation,
      moneyText,
      playerCount,
      timestamp: Date.now()
    });

    // Keep only the last 10 notifications
    notifications = notifications.slice(-10);
  }

  res.status(200).send('Webhook received');
});

// Endpoint for Roblox to fetch notifications
app.get('/notifications', (req, res) => {
  // Filter out notifications older than 5 minutes
  const recentNotifications = notifications.filter(n => Date.now() - n.timestamp < 5 * 60 * 1000);
  res.json(recentNotifications);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
