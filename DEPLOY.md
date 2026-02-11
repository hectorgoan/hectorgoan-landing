# Deploying Your Landing Page to GitHub Pages

Follow these steps to publish your new landing page for free using GitHub Pages.

## Prerequisites

- You need a [GitHub account](https://github.com/).
- You need `git` installed on your machine.

## Step 1: Initialize a Git Repository

Open your terminal in the project folder:

```bash
git init
git add .
git commit -m "Initial commit: Personal landing page"
```

## Step 2: Create a Repository on GitHub

1. Go to [repo.new](https://repo.new).
2. Name the repository (e.g., `hectorgoan-landing` or `hectorgoan.github.io`).
3. Set visibility to **Public**.
4. Click **Create repository**.

## Step 3: Push Your Code

Copy the commands shown on GitHub under "…or push an existing repository from the command line". They will look like this (replace `YOUR_USERNAME` with your actual username):

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hectorgoan-landing.git
git push -u origin main
```

## Step 4: Enable GitHub Pages

1. Go to your repository **Settings** tab.
2. Click **Pages** on the left sidebar.
3. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
4. Under **Branch**, select `main` and ensure the folder is `/(root)`.
5. Click **Save**.

## Step 5: Verify

GitHub will take a minute or two to build your site. Refresh the Pages settings page to see your live URL.
