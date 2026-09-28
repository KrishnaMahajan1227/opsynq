# Windows Local Recovery

If Vite reports `Cannot find module @rollup/rollup-win32-x64-msvc` or the backend previously reported `nodemon is not recognized`, use this sequence from the repository root:

```powershell
npm run clean:install
npm cache verify
npm install
npm run doctor
npm run seed:platform
```

Then start three terminals from the repository root:

```powershell
npm run dev:api
npm run dev:platform
npm run dev:agency
```

Finally:

```powershell
npm run verify:local
```

Notes:
- API development now uses Node's built-in `--watch`; `nodemon` is no longer required.
- The Windows Rollup native package is explicitly declared as an optional dependency to reduce npm optional-dependency install failures.
- If `npm install` is interrupted or partially completes, repeat the clean-install sequence before retrying.
