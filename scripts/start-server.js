// Script to start the Express server
const { spawn } = require("child_process");

console.log("Starting QR Code Generator Express server...");

const server = spawn("node", ["server.js"], {
  stdio: "inherit",
  cwd: process.cwd(),
});

server.on("close", (code) => {
  console.log(`Server process exited with code ${code}`);
});

server.on("error", (error) => {
  console.error("Failed to start server:", error);
});
