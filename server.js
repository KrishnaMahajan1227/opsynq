// Root entrypoint for the single-project Vercel deployment.
// The real API/socket server remains in services/api/server.js so local and
// hosted deployments execute the same backend code.
module.exports = require('./services/api/server');
