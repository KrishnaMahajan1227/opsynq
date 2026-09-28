# New DB Setup

No production DB URI is included.

Create a new MongoDB database and set:

`services/api/.env`

```env
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER/opsynq_global
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
```

The old project's `.env` and credentials are intentionally not copied into this repository.
