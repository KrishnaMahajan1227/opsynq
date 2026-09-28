const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const fieldVerificationRoutes = require('./routes/fieldVerificationRoutes');
const installationRoutes = require('./routes/installationRoutes');
const technicianChangeRoutes = require('./routes/technicianChangeRoutes');
const agencyInventoryRoutes = require('./routes/agencyInventoryRoutes');
const platformAuthRoutes = require('./routes/platform/authRoutes');
const platformCompanyRoutes = require('./routes/platform/companyRoutes');
const platformOperationsRoutes = require('./routes/platform/operationsRoutes');
const platformInventoryRoutes = require('./routes/platform/inventoryRoutes');
const platformLogisticsRoutes = require('./routes/platform/logisticsRoutes');
const platformServiceRoutes = require('./routes/platform/serviceRoutes');
const platformGovernanceRoutes = require('./routes/platform/governanceRoutes');
const platformAssuranceRoutes = require('./routes/platform/assuranceRoutes');
const platformAutomationRoutes = require('./routes/platform/automationRoutes');
const platformSearchRoutes = require('./routes/platform/searchRoutes');
const platformTeamRoutes = require('./routes/platform/teamRoutes');
const platformReadinessRoutes = require('./routes/platform/readinessRoutes');
const platformIntelligenceRoutes = require('./routes/platform/intelligenceRoutes');
const platformRegulatoryRoutes = require('./routes/platform/regulatoryRoutes');
const platformConfigurationRoutes = require('./routes/platform/configurationRoutes');
const unifiedAuthRoutes = require('./routes/unifiedAuthRoutes');
const { requestContext, authRateLimit, rejectUnsafeKeys } = require('./middleware/security');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { assertSecurityConfig } = require('./utils/securityConfig');
assertSecurityConfig();

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use(requestContext);
app.use((req,res,next)=>{const started=Date.now();const end=res.end;res.end=function(...args){if(!res.headersSent)res.setHeader('X-Response-Time',`${Date.now()-started}ms`);return end.apply(this,args)};next();});

// Enable CORS. Vercel deployment URLs are included automatically, so preview and
// production deployments work without hardcoding a generated *.vercel.app host.
const configuredOrigins = String(process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(',').map(v => v.trim()).filter(Boolean);
const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean).map(v => `https://${String(v).replace(/^https?:\/\//,'').replace(/\/$/,'')}`);
const allowedOrigins = [...new Set([...configuredOrigins, ...vercelOrigins])];
const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin);
app.use(cors({ origin: (origin, cb) => (isAllowedOrigin(origin) ? cb(null, true) : cb(new Error('Origin not allowed by CORS'))), credentials: true }));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(rejectUnsafeKeys);

// Serve static files for uploads and demo showcase media
app.use('/uploads', express.static(path.join(__dirname,'uploads'),{fallthrough:true,maxAge:process.env.NODE_ENV==='production'?'1h':0}));
app.use('/demo-media', express.static(path.join(__dirname,'demo-media'),{fallthrough:true,maxAge:process.env.NODE_ENV==='production'?'1h':'5m'}));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  if(process.env.NODE_ENV!=='test') console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount routes
console.log('Mounting routes...');
app.use('/api/auth', authRoutes);
app.use('/api/unified-auth', unifiedAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/farmers', farmerRoutes); // Includes /api/farmers/upload
app.use('/api/field-verification', fieldVerificationRoutes);
app.use('/api/installation', installationRoutes);
app.use('/api/technician-changes', technicianChangeRoutes);
app.use('/api/agency-inventory', agencyInventoryRoutes);
app.use('/api/platform/auth', authRateLimit, platformAuthRoutes);
app.use('/api/platform/companies', platformCompanyRoutes);
app.use('/api/platform/operations', platformOperationsRoutes);
app.use('/api/platform/inventory', platformInventoryRoutes);
app.use('/api/platform/logistics', platformLogisticsRoutes);
app.use('/api/platform/service', platformServiceRoutes);
app.use('/api/platform/governance', platformGovernanceRoutes);
app.use('/api/platform/assurance', platformAssuranceRoutes);
app.use('/api/platform/automation', platformAutomationRoutes);
app.use('/api/platform/search', platformSearchRoutes);
app.use('/api/platform/team', platformTeamRoutes);
app.use('/api/platform/readiness', platformReadinessRoutes);
app.use('/api/platform/intelligence', platformIntelligenceRoutes);
app.use('/api/platform/regulatory', platformRegulatoryRoutes);
app.use('/api/platform/configuration', platformConfigurationRoutes);
const mongoose = require('mongoose');
const pkg = require('../../package.json');
const healthPayload=(req)=>({ok:true,service:'opsynq-api',version:pkg.version||'1.0.0',requestId:req.requestId,timestamp:new Date().toISOString()});
app.get('/api/health', (req,res)=>res.json(healthPayload(req)));
app.get('/api/health/live',(req,res)=>res.json({...healthPayload(req),status:'live',uptimeSeconds:Math.round(process.uptime())}));
app.get('/api/health/ready',(req,res)=>{const ready=mongoose.connection.readyState===1;res.status(ready?200:503).json({...healthPayload(req),ok:ready,status:ready?'ready':'not_ready',database:ready?'connected':'not_connected',databaseName:mongoose.connection.name||null})});
app.get('/api/health/version',(req,res)=>res.json({service:'opsynq-api',version:pkg.version||'1.0.0'}));
const {getRevision}=require('./utils/runtimeRevision');
app.get('/api/runtime/revision',(req,res)=>res.set('Cache-Control','no-store').json({revision:getRevision(),version:pkg.version||'1.0.0',releaseId:process.env.RELEASE_ID||process.env.COMMIT_SHA||null}));
// Vercel Hobby cron: once daily. Pro deployments can increase frequency later.
app.get('/api/cron/automation', async (req, res, next) => {
  try {
    const secret = String(process.env.CRON_SECRET || '');
    if (!secret || req.get('authorization') !== `Bearer ${secret}`) return res.status(401).json({ message: 'Unauthorized' });
    const results = await require('./utils/automationEngine').runCycle('VERCEL_CRON');
    res.json({ ok: true, runs: results.length, completedAt: new Date().toISOString() });
  } catch (error) { next(error); }
});

// Handle 404 for undefined routes
app.use((req, res) => {
  console.warn(`404: Route not found for ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`Server error [${req.requestId||'n/a'}]: ${err.message}`, err.stack);
  const isCors=err.message==='Origin not allowed by CORS';
  const status=isCors?403:(Number(err.status)||500);
  const body={message:isCors?'Origin not allowed.':(status>=500?'Server error':err.message),requestId:req.requestId};
  if(process.env.NODE_ENV!=='production'&&status>=500)body.error=err.message;
  res.status(status).json(body);
});

const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: (origin, cb) => (isAllowedOrigin(origin) ? cb(null, true) : cb(new Error('Origin not allowed by CORS'))), credentials: true } });

// ✅ ADD THIS LINE to import User model (adjust path if needed)
const User = require('./models/User');
const jwt = require('jsonwebtoken');

// Authenticate every real-time connection. Location data is sensitive and must
// never be accepted from or broadcast to an anonymous socket.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id username mobile role isActive tokenVersion').lean();
    if (!user || user.isActive === false) return next(new Error('User account is inactive'));
    if (Number(decoded.tv || 0) !== Number(user.tokenVersion || 0)) return next(new Error('Session has been invalidated'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid or expired session'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  if (['admin', 'superadmin'].includes(socket.user?.role)) socket.join('location-monitors');

  // Persist and broadcast the latest known location for every authenticated ERP user.
  // The legacy `techStatus` event is still supported for older technician clients.
  const handleLocationStatus = async (data = {}) => {
    try {
      if (!socket.user || !Number.isFinite(Number(data.latitude)) || !Number.isFinite(Number(data.longitude))) return;

      const now = new Date();
      const capturedAt = data.timestamp ? new Date(data.timestamp) : now;
      const location = {
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        accuracy: Math.max(0, Number(data.accuracy || 0)),
        address: typeof data.address === 'string' ? data.address.slice(0, 500) : '',
        capturedAt: Number.isNaN(capturedAt.getTime()) ? now : capturedAt,
        updatedAt: now,
      };
      // Identity comes only from the verified socket token; never trust a client supplied user id/mobile.
      const user = await User.findByIdAndUpdate(socket.user._id, { $set: { lastLocation: location } }, { new: true })
        .select('username mobile role lastLocation')
        .lean();
      if (!user) return;

      const enrichedData = {
        userId: String(user._id),
        technicianId: user.mobile,
        username: user.username,
        mobile: user.mobile,
        technicianMobile: user.mobile,
        role: user.role,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address,
        timestamp: location.capturedAt.getTime(),
      };
      // Only Admin/Superadmin monitoring sockets receive organization-wide location data.
      io.to('location-monitors').emit('userStatus', enrichedData);
      if (user.role === 'field_technician') io.to('location-monitors').emit('techStatus', enrichedData);
    } catch (err) {
      console.error('Error persisting user location:', err);
    }
  };

  socket.on('userStatus', handleLocationStatus);
  socket.on('techStatus', handleLocationStatus);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


// Connect to MongoDB and start the Node HTTP server. Vercel's current Node runtime
// supports standard Node servers (including Socket.IO/WebSockets), so this same
// entrypoint is used locally and on Vercel. The in-process 15-minute scheduler is
// disabled on Vercel because instances can scale to zero; a daily Hobby-compatible
// cron route below triggers the automation cycle instead.
const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      if (!process.env.VERCEL) require('./utils/automationEngine').startScheduler();
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    if (!process.env.VERCEL) process.exit(1);
  });

let shuttingDown=false;
async function gracefulShutdown(signal){
  if(shuttingDown)return;shuttingDown=true;
  console.log(`${signal} received. Closing Opsynq API gracefully...`);
  server.close(async()=>{
    try{await mongoose.connection.close(false);}catch(e){console.error('MongoDB close error:',e.message)}
    if (!process.env.VERCEL) process.exit(0);
  });
  if (!process.env.VERCEL) setTimeout(()=>process.exit(1),10000).unref();
}
process.on('SIGTERM',()=>gracefulShutdown('SIGTERM'));
process.on('SIGINT',()=>gracefulShutdown('SIGINT'));
process.on('unhandledRejection',err=>console.error('Unhandled rejection:',err));
process.on('uncaughtException',err=>{console.error('Uncaught exception:',err);if (!process.env.VERCEL) gracefulShutdown('UNCAUGHT_EXCEPTION')});

module.exports = server;
