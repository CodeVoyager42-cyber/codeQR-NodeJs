const express = require("express");
const QRCode = require("qrcode");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory user store: key is userId, value is { id, name }
const users = {};

// Helper: generate a consistent 10-digit ID for a name
function getUserId(name) {
  const hash = crypto
    .createHash("sha256")
    .update(name.trim().toLowerCase())
    .digest("hex");
  const num = Math.abs(parseInt(hash.slice(0, 15), 16))
    .toString()
    .padStart(10, "0")
    .slice(0, 10);
  return num;
}

// Homepage route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/create-user", (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).send("Name is required");
  }
  const trimmedName = name.trim();
  const userId = getUserId(trimmedName);
  if (users[userId]) {
    return res.status(409).send("User already exists");
  }
  users[userId] = {
    id: userId,
    name: trimmedName,
  };
  res.redirect(`/user/${userId}/qr`);
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const user = users[userId];
  if (!user) {
    return res.status(404).send("User not found");
  }
  res.send(`id: ${user.id}`);
});

app.get("/user/:id/qr", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = users[userId];
    if (!user) {
      return res.status(404).send("User not found");
    }
    const qrText = `id: ${user.id}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrText, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>QR Code for ${user.name}</title>
          <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' rel='stylesheet'>
          <link rel="stylesheet" href="/styles/qr.css">
        </head>
        <body>
          <div class="container">
            <h1>🔗 Your QR Code</h1>
            <div class="info">
              <p><strong>Name:</strong> ${user.name}</p>
              <p><strong>User ID:</strong> <span id="user-id">${user.id}</span></p>
              <button class="btn" id="copy-btn" type="button">Copy User ID</button>
              <span id="copy-status">Copied!</span>
            </div>
            <div class="qr-code">
              <img src="${qrCodeDataURL}" alt="QR Code for ${user.name}" />
            </div>
            <div class="links">
              <a href="/user/${userId}">View Profile</a> | <a href="/">← Create Another User</a>
            </div>
          </div>
          <script>
            const copyBtn = document.getElementById('copy-btn');
            const copyStatus = document.getElementById('copy-status');
            copyBtn.onclick = function() {
              const userId = document.getElementById('user-id').textContent;
              navigator.clipboard.writeText(userId).then(function() {
                copyStatus.classList.add('show');
                setTimeout(function() {
                  copyStatus.classList.remove('show');
                }, 1200);
              });
            };
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).send("Error generating QR code");
  }
});

// REST API endpoints
// Get all users
app.get('/api/users', (req, res) => {
  const allUsers = Object.values(users);
  res.json(allUsers);
});

// Get a user by ID
app.get('/api/users/:id', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Create a user
app.post('/api/users', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  const trimmedName = name.trim();
  const userId = getUserId(trimmedName);
  if (users[userId]) {
    return res.status(409).json({ error: 'User already exists' });
  }
  users[userId] = { id: userId, name: trimmedName };
  res.status(201).json(users[userId]);
});

// Delete a user
app.delete('/api/users/:id', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  delete users[req.params.id];
  res.json({ success: true });
});

// Get QR code for a user
app.get('/api/users/:id/qr', async (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  const qrText = `id: ${user.id}`;
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrText, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    res.json({ qr: qrCodeDataURL });
  } catch (error) {
    res.status(500).json({ error: 'Error generating QR code' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`QR Code Generator server running on http://localhost:${PORT}`);
});

module.exports = app;
