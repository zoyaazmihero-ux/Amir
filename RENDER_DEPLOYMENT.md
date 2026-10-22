# 🚀 Render Deployment Guide / Render पर लाइव वेबसाइट कैसे चलाएं

यह गाइड आपको अपनी **Aniverse Crunchyroll Streaming App** को [Render.com](https://render.com) पर 100% फ्री में लाइव डिप्लॉय करने के पूरे स्टेप्स बताती है।

---

## ⚡ सबसे तेज़ तरीका (Method 1: Connect with GitHub - Recommended)

### स्टेप 1: GitHub पर कोड पुश करें
1. अपने प्रोजेक्ट को GitHub रिपॉजिटरी में पुश करें।

### स्टेप 2: Render.com पर जाएं
1. [dashboard.render.com](https://dashboard.render.com) खोलें।
2. **New +** बटन दबाएं और **Web Service** चुनें।
3. अपनी GitHub रिपॉजिटरी चुनें और **Connect** दबाएं।

### स्टेप 3: Settings भरें
नीचे दी गई सेटिंग्स को भरें:

| Setting | Value |
| :--- | :--- |
| **Name** | `aniverse-streaming` (या अपनी पसंद का कोई भी नाम) |
| **Region** | `Oregon (US West)` या `Singapore` |
| **Branch** | `main` |
| **Root Directory** | *(खाली छोड़ें)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Plan** | **Free** ($0/month) |

### स्टेप 4: Environment Variables (पर्यावरण चर)
**Advanced** पर क्लिक करके **Add Environment Variable** दबाएं:
- `NODE_ENV` = `production`
- `PORT` = `10000` *(Render अपने आप भी PORT सेट करता है)*

### स्टेप 5: Deploy Web Service पर क्लिक करें!
- Render अपने आप `npm install` करेगा, Vite frontend को `dist/` में बिल्ड करेगा, और Express backend को पोर्ट 10000 पर स्टार्ट कर देगा।
- 2-3 मिनट में आपकी लाइव URL मिल जाएगी जैसे: `https://aniverse-streaming.onrender.com`!

---

## 🐳 तरीका 2: Docker Web Service (FFmpeg और लाइव ट्रांसकोडिंग के लिए बेस्ट)
यदि आपको FFmpeg से MKV टू MP4 लाइव कन्वर्जन और सबटाइटल एक्सट्रैक्शन क्लाउड पर 100% चाहिए:
1. Render में **Web Service** बनाते समय **Runtime** में **Docker** चुनें।
2. Render आपके प्रोजेक्ट में पहले से तैयार `Dockerfile` को डिटेक्ट करके अपने आप FFmpeg और Node 20 के साथ बिल्ड कर देगा!
3. किसी एक्स्ट्रा कमांड की ज़रूरत नहीं होगी!

---

## 📄 तरीका 3: Render Blueprint (1-Click Deploy with `render.yaml`)
प्रोजेक्ट में पहले से `render.yaml` शामिल है:
1. Render डैशबोर्ड में **Blueprints** पर जाएं।
2. **New Blueprint Instance** पर क्लिक करें और अपनी रेपो कनेक्ट करें।
3. Render पूरी सेटिंग्स (`render.yaml` से) खुद लोड कर लेगा।

---

## 🛠️ सामान्य समस्याएं और समाधान (Troubleshooting)
1. **Health Check**:
   - ऐप का हेल्थ चेक एंडपॉइंट: `/api/health`
2. **Port Binding**:
   - `server.ts` में `process.env.PORT` सपोर्ट है, इसलिए Render का पोर्ट 10000 आसानी से कनेक्ट होता है।
3. **Static Assets**:
   - प्रोडक्शन में Express अपने आप `dist/` फोल्डर से सभी पेजों और एसेट्स को सर्व करता है।
