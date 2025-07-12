# 🚀 Deployment Guide for Tevin's Dino Game

## Quick Deploy Options

### **Option 1: Heroku (Recommended - Free)**

1. **Install Heroku CLI**
   ```bash
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create tevin-dinogame
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy Tevin's Dino Game"
   git push heroku main
   ```

5. **Open your game**
   ```bash
   heroku open
   ```

### **Option 2: Railway (Alternative - Free)**

1. **Go to Railway.app**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-deploy

3. **Get your URL**
   - Railway will give you a URL like: `https://your-app-name.railway.app`

### **Option 3: Render (Another Free Option)**

1. **Go to Render.com**
   - Visit https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Deploy**
   - Render will auto-deploy your app

## Environment Variables

Your game should work without any environment variables, but if needed:

```bash
# For Heroku
heroku config:set NODE_ENV=production

# For Railway/Render
# Add in their dashboard: NODE_ENV=production
```

## Custom Domain (Optional)

### **Heroku**
```bash
heroku domains:add yourdomain.com
```

### **Railway/Render**
- Add custom domain in their dashboard

## Monitoring Your Game

### **Heroku**
```bash
# View logs
heroku logs --tail

# Check app status
heroku ps
```

### **Railway/Render**
- Use their dashboard to monitor logs and performance

## Troubleshooting

### **Common Issues:**

1. **Port Issues**
   - The app uses `process.env.PORT` automatically
   - No changes needed

2. **WebSocket Issues**
   - All platforms support WebSockets
   - Should work out of the box

3. **Static Files**
   - Files in `public/` folder are served automatically
   - No additional configuration needed

## Your Game URL

After deployment, your game will be available at:
- **Heroku**: `https://tevin-dinogame.herokuapp.com`
- **Railway**: `https://your-app-name.railway.app`
- **Render**: `https://your-app-name.onrender.com`

## Sharing Your Game

Once deployed, you can share your game with:
- **Friends**: Send them the URL
- **Social Media**: Post the link
- **Portfolio**: Add to your developer portfolio

## Made by Tevin 🦖

Your game will show "Created by Tevin" and "Made with ❤️ by Tevin" on the website!

---

**Good luck with your deployment!** 🚀 