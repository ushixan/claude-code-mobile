# 🛡️ Proxy Feature - Bypass X-Frame-Options

## ✅ Problem Solved!

The preview tab now includes a **proxy server** that can bypass iframe blocking from sites like GitHub, Google, Facebook, etc.

## 🔧 How to Use the Proxy:

### Step 1: Enable Proxy Mode
1. Go to the **Preview** tab
2. Click the **Shield icon** (🛡️) in the URL bar
3. Shield turns **green** when proxy is enabled

### Step 2: Enter Any URL
- Type any blocked URL: `https://github.com`, `https://google.com`, etc.
- Press Enter or click refresh
- The page will now load through the proxy!

### Step 3: Visual Indicators
- **Blue banner** at top: "📱 Viewing via Mobile Terminal IDE Proxy"
- **Green shield icon**: Proxy is active
- **Links and images work**: Base URLs are automatically fixed

## 🎯 What the Proxy Does:

1. **Fetches the page** on the server side
2. **Removes X-Frame-Options** headers that block iframes
3. **Fixes relative URLs** by adding base tags
4. **Removes frame-busting** JavaScript code
5. **Adds visual indicator** that you're viewing via proxy

## 📱 Usage Examples:

```
✅ GitHub repos: https://github.com/user/repo
✅ Google search: https://google.com
✅ Documentation: https://docs.example.com
✅ Any website that blocks iframes
```

## ⚡ When to Use:

- **Proxy ON**: For external sites that block iframes
- **Proxy OFF**: For localhost development servers (faster)

## 🔒 Security Notes:

- Proxy only works for HTTP/HTTPS URLs
- Content is fetched server-side (private browsing)
- Visual indicator shows when you're using proxy
- Local development servers don't need proxy

## 🚀 Deploy the Fixed Version:

```bash
git add .
git commit -m "Add proxy server to bypass X-Frame-Options blocking"
git push
```

**Now you can view ANY website in the preview tab!** 🎉