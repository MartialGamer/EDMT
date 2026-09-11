# EDMT

Elite Dangerous Mining Tracker, a local-first surface mining site log.

## Local development

```bash
npm install
npm run dev
```

Create a production build with `npm run build` and preview it with `npm run preview`.

## GitHub Pages

The repository includes a workflow at `.github/workflows/deploy.yml`. Push the project to a GitHub repository using the `main` branch, then configure:

1. Open **Settings > Pages** in the repository.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` or run the **Deploy to GitHub Pages** workflow manually.

The workflow builds `dist/` and deploys it automatically. Vite is configured with a relative base path, so it works at both the repository Pages URL and a custom domain.

Site data is stored in the browser's local storage. Use JSON export for backups or sharing between devices.
