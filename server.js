const express = require("express");
const QRCode = require("qrcode");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set view engine to serve HTML
app.set("view engine", "html");

const users = new Map();

// Homepage route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).send("User not found");
  }

  res.send(`id: ${user.id}`);
});

app.get("/user/:id/qr", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = users.get(userId);

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
      <html>
        <head>
          <title>QR Code for ${user.name}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              min-height: 100vh; 
              margin: 0; 
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 20px; 
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
              max-width: 500px; 
              margin: 0 auto; 
            }
            h1 { color: #333; margin-bottom: 20px; }
            .qr-code { margin: 30px 0; }
            .info { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
            a { color: #667eea; text-decoration: none; font-weight: 600; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔗 Your QR Code</h1>
            <div class="info">
              <p><strong>Name:</strong> ${user.name}</p>
              <p><strong>User ID:</strong> ${user.id}</p>
            </div>
            <div class="qr-code">
              <img src="${qrCodeDataURL}" alt="QR Code for ${user.name}" />
            </div>
            <p>Scan this QR code to see your ID!</p>
            <p><a href="/user/${userId}">View Profile</a> | <a href="/">← Create Another User</a></p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).send("Error generating QR code");
  }
});

app.post("/create-user", (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  const userId = Math.floor(Math.random() * 100000000).toString();
  const user = {
    id: userId,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  users.set(userId, user);

  // Redirect to show the QR code
  res.redirect(`/user/${userId}/qr`);
});

// Start server
app.listen(PORT, () => {
  console.log(`QR Code Generator server running on http://localhost:${PORT}`);
});

module.exports = app;
