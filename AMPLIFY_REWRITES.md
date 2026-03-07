# Amplify Rewrite Rules for SPA (Single Page Application)
# Save this as rewrites.json in your project root or configure in Amplify Console

[
  {
    "source": "/<*>.html",
    "target": "/index.html",
    "status": "200",
    "condition": "FileExists"
  },
  {
    "source": "/**",
    "target": "/index.html",
    "status": "200",
    "condition": "FileExists"
  }
]
