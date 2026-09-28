# Solarize Backend V7 location update

- User schema now stores `lastLocation` (latitude, longitude, accuracy, address, capturedAt, updatedAt).
- Socket.IO connections require the existing JWT in `socket.handshake.auth.token`.
- The server derives user identity from the verified token, not from location payload fields.
- Location updates are persisted in MongoDB and emitted as `userStatus`.
- Admin/Superadmin sockets join a private `location-monitors` room and are the only clients receiving organization-wide location broadcasts.
- Legacy `techStatus` input remains accepted for the updated technician client, but identity is still taken from the authenticated socket.
- No new package dependency was added; existing `jsonwebtoken`, `mongoose`, and `socket.io` are used.
