# Pushing Your Code to GitHub

This guide will walk you through the process of pushing your project code to a GitHub repository for the first time and how to update it with subsequent changes.

## 1. Pushing for the First Time

If you have a new project locally and want to upload it to a new, empty repository on GitHub, follow these steps.

### Step 1: Create a New Repository on GitHub

1.  Go to [GitHub](https://github.com) and log in.
2.  Click the `+` icon in the top-right corner and select **New repository**.
3.  Give your repository a name (e.g., `resume-buddy-app`).
4.  Optionally, add a description.
5.  Keep the repository **Public** or **Private** based on your preference.
6.  **Do not** initialize the new repository with a `README.md`, `.gitignore`, or license file, as your project already contains these.
7.  Click **Create repository**.

### Step 2: Push Your Local Code

On the next page, GitHub will show you a URL for your new repository. Open your terminal, navigate to your project's root directory, and run the following commands.

```bash
# Initialize a new Git repository (if you haven't already)
git init

# Add all files to the staging area
git add .

# Commit your files with a message
git commit -m "Initial commit: Setup ResumeBuddy project"

# Rename the default branch to 'main' (a common practice)
git branch -M main

# Add the URL of your new GitHub repository as the remote
git remote add origin https://github.com/Rajeevkavala/Resume-Buddy_Nextjs.git


# Push your code to the 'main' branch on GitHub
git push -u origin main
```

Replace `YourUsername` and `YourRepositoryName.git` with your actual GitHub username and repository name. Your code is now on GitHub!

---

## 2. Pushing Subsequent Changes

After the initial push, you will make changes and improvements to your code. Follow this simple workflow to keep your GitHub repository updated.

### Step 1: Check the Status

It's good practice to see which files you've modified.

```bash
git status
```

### Step 2: Stage Your Changes

Add the files you want to include in your next commit to the staging area.

```bash
# To add all modified files
git add .

# Or to add a specific file
git add src/app/page.tsx
```

### Step 3: Commit Your Changes

Commit your staged changes with a clear, descriptive message about what you've done.

```bash
git commit -m "feat: Implement user dashboard UI"
```

> **Tip**: Writing good commit messages is a great habit. A common format is `type: short description` (e.g., `fix: Correct login button alignment`).

### Step 4: Push to GitHub

Push your committed changes to the remote repository.

```bash
git push
```

Since you used the `-u` flag during the first push, Git remembers where to push your changes.