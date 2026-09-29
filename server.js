// Root entrypoint for the single-project Vercel deployment.
//
// Vercel's Express framework detector statically inspects the project-root
// entrypoint and expects it to import Express directly. The real application
// (routes, Socket.IO, auth, static frontends, automation, etc.) remains in
// services/api/server.js so local and hosted deployments still execute the
// exact same backend code.
//
// Keep this direct import at the root even though the API server also imports
// Express internally; it is intentionally here for deployment detection.
const express = require('express');
void express;

module.exports = require('./services/api/server');
 