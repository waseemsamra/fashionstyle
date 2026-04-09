# 🚀 Force Amplify Rebuild

## Check If Build Is Running

1. Go to **AWS Amplify Console**
2. Click your app
3. Look at **Deployments** tab
4. Check if latest commit (`fdfc19f - update auto AI`) is building or deployed

## If NOT Building Yet

### **Option 1: Trigger Manual Deploy**
1. In Amplify Console, click **Redeploy this version** button
2. Or click **Deploy latest commit**

### **Option 2: Force Rebuild**
1. Go to **App settings** → **General**
2. Scroll down to **Redeploy this version**
3. Click **Redeploy**

## Wait For Build To Complete

- Build takes **3-5 minutes**
- Watch the build logs
- Look for "Build completed successfully"

## After Deploy

1. **Hard refresh** your browser:
   - **Chrome**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Or clear browser cache
2. Test AI Try-On again

## Still Not Working?

If CORS proxy is blocked, try alternative proxy:

Open `src/services/aiTryOnService.ts` and change:

```typescript
const CORS_PROXY = 'https://corsproxy.io/?';
```

To:

```typescript
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
```

Then:
```bash
git add -A
git commit -m "fix: try alternative CORS proxy"
git push
```
