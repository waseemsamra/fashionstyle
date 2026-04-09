# 🚀 Deploy AI Try-On to Backend (5 Minutes)

## ✅ What's Already Done

- ✅ Lambda code written: `routes/aiTryOn.js`
- ✅ Frontend updated: Calls your backend instead of Hugging Face
- ✅ Build successful: No errors

---

## 📋 What You Need To Do (3 Steps)

### **Step 1: Add Route to app.js**

Open `app.js` and add this line **before** `app.listen()`:

```javascript
// Add this near your other routes (around line 200-300)
app.use('/ai-tryon', require('./routes/aiTryOn'));
```

**Example location:**
```javascript
// ... your existing routes ...

// AI Virtual Try-On
app.use('/ai-tryon', require('./routes/aiTryOn'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### **Step 2: Add Environment Variable**

In your **AWS Amplify Console** or **server environment**:

**For Amplify:**
1. Go to Amplify Console → Your App → App settings → Environment variables
2. Add:
   - **Key**: `HUGGING_FACE_API_KEY`
   - **Value**: `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`
3. Save

**For Local/Server:**
Already in your `.env` file! ✅

---

### **Step 3: Deploy**

```bash
# Commit and push
git add .
git commit -m "feat: add AI virtual try-on backend route"
git push
```

Amplify will automatically rebuild and deploy!

---

## ✅ Test After Deployment

1. Go to your app
2. Open any product
3. Click "Try On"
4. Upload photo
5. Click "Generate AI Try-On"
6. Should work! ✨

---

## 🐛 Troubleshooting

### **"Hugging Face API key not configured"**
- Check environment variable is set in Amplify
- Redeploy after adding it

### **404 Error on /ai-tryon**
- Make sure you added the route to `app.js`
- Check the path is correct

### **Still CORS Error**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)

---

## 🎉 That's It!

Only **2 lines of code** to add to your backend:

1. Import the route
2. Add environment variable

**Done!** 🚀
