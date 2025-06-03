# Run and deploy the AI Studio app 'MusicalBirthdayQuest'

**`A Vite/React web app for the Mixtape Challenge.`**

---

## Build & Deployment Guide (GitHub Pages)

This guide explains how to build and deploy the **MusicalBirthdayQuest** app to GitHub Pages, including secure API key usage.

---

### Prerequisites

- Node.js and npm installed
- Git installed
- A [Gemini API key](https://ai.google.dev/gemini-api/docs/api-key)
- Access to the [MusicalBirthdayQuest GitHub repository](https://github.com/sabank/MusicalBirthdayQuest)

---

### 1. Clone the Repository

```sh
git clone https://github.com/<YOUR_USERNAME>/MusicalBirthdayQuest.git
cd MusicalBirthdayQuest
```

---

### 2. Add Your API Key

Create a `.env` file in the project root:

```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

> **Note:** Never commit your `.env` file to the repository.

---

### 3. Install Dependencies

```sh
npm install
```

---

### 4. Verify Configuration

- In `package.json`, ensure:
  ```json
  "name": "MusicalBirthdayQuest",
  "homepage": "https://<YOUR_USERNAME>.github.io/MusicalBirthdayQuest/",
  ```
- In `vite.config.ts`, ensure:
  ```typescript
  base: '/MusicalBirthdayQuest/',
  ```
- In your code, access the API key as:
  ```typescript
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  ```

---

### 5. Build the Project

```sh
npm run build
```
This creates a `dist` folder with production-ready files.

---

### 6. Manual Deployment to GitHub Pages

#### a. Create a Fresh `gh-pages` Branch

```sh
git checkout --orphan gh-pages
git rm -rf .
```

#### b. Move Build Files to Root

```sh
Move-Item -Path .\dist\* -Destination .\
Remove-Item -Recurse -Force .\dist
```
*(Or use File Explorer to move files from `dist` to the project root, then delete `dist`.)*

#### c. Commit and Push

```sh
git add .
git commit -m "Deploy to GitHub Pages"
git push -f origin gh-pages
```

---

### 7. Configure GitHub Pages

1. Go to your repository on GitHub.
2. Navigate to **Settings > Pages**.
3. Set the source to the `gh-pages` branch and folder to `/ (root)`.
4. Save.

---

### 8. Access Your Live Site

After a few minutes, your app will be live at:  
https://<YOUR_USERNAME>.github.io/MusicalBirthdayQuest/

---

### 9. Updating the Site

1. Switch to `main` branch and make your changes.
2. Repeat steps 5 and 6 to rebuild and redeploy.

---

### Notes

- The `.env` file is **not** included in the deployed site; the API key is embedded at build time.
- Never commit your `.env` file to the repository.
- For security, restrict your API key in the Google Cloud Console as much as possible.

