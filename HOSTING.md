# Hosting this website

This is a plain static site: `index.html` plus the `assets`, `materials`, `data` and `templates`
folders. It needs no build step, server code or database.

## Option 1: GitHub Pages (recommended)

1. Open the repository on GitHub, then **Settings**, then **Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose branch **main** and folder **/ (root)**, then **Save**.
4. After one or two minutes the site is live at https://mohammadyahoo.github.io/ds-python-course/

With the GitHub CLI the same step is:

```
gh api -X POST repos/mohammadyahoo/ds-python-course/pages -f "source[branch]=main" -f "source[path]=/"
```

The repository must be public for GitHub Pages on a free account, and for the Colab links.

## Option 2: run it on this computer

```
git clone https://github.com/mohammadyahoo/ds-python-course.git
cd ds-python-course
python -m http.server 8000
```

Then open http://localhost:8000 in a browser.

## Updating

Change files, commit and push to `main`. GitHub Pages republishes automatically within a minute or two.
Settings typed on the Settings page (start date, session days, form link) are stored in each browser only.
