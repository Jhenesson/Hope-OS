import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

console.log("Server starting...");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set");
console.log("GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI);
console.log("NODE_ENV:", process.env.NODE_ENV);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const getRedirectUri = (req: express.Request) => {
  // Priority 1: Explicit override via environment variable
  if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.startsWith('http')) {
    return process.env.GOOGLE_REDIRECT_URI;
  }

  // Priority 2: Use APP_URL provided by the platform (Recommended)
  if (process.env.APP_URL) {
    const baseUrl = process.env.APP_URL.replace(/\/+$/, "");
    return `${baseUrl}/api/auth/google/callback`;
  }

  // Priority 3: Dynamic detection (Fallback for local dev)
  const host = req.get("host") || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || (host?.includes("localhost") ? "http" : "https");
  const cleanHost = host?.replace(/\/+$/, "");
  return `${protocol}://${cleanHost}/api/auth/google/callback`;
};

// API Routes
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/auth/google/debug", (req, res) => {
  const redirectUri = getRedirectUri(req);
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const hasTokens = !!req.cookies.google_tokens;
  
  res.json({ 
    redirectUri,
    clientIdStatus: clientId ? `Configurado (termina em ...${clientId.slice(-6)})` : "Não configurado",
    hasSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    envRedirectUri: process.env.GOOGLE_REDIRECT_URI || "Não definido",
    appUrl: process.env.APP_URL || "Não definido",
    cookieStatus: hasTokens ? "Presente" : "Ausente",
    cookiesReceived: Object.keys(req.cookies),
    userAgent: req.get('User-Agent')
  });
});

app.get("/api/auth/google/url", (req, res) => {
  console.log("GET /api/auth/google/url");
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google OAuth credentials");
      return res.status(500).json({ error: "Google OAuth credentials are not configured in environment variables." });
    }

    const redirectUri = getRedirectUri(req);
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent", // Force consent to ensure refresh token is always provided
    });
    res.json({ url });
  } catch (error: any) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ error: error.message || "Failed to generate auth URL" });
  }
});

app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
  console.log("GET /api/auth/google/callback", req.query);
  const { code } = req.query;
  try {
    const redirectUri = getRedirectUri(req);
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await client.getToken(code as string);
    
    // Store tokens in a cookie
    const cookieValue = JSON.stringify(tokens);
    const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    
    // Using explicit Set-Cookie header to ensure Partitioned attribute is correctly applied
    // This is critical for third-party context (iframes) in modern browsers
    res.setHeader('Set-Cookie', [
      `google_tokens=${encodeURIComponent(cookieValue)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=None; Partitioned`
    ]);

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                tokens: ${JSON.stringify(tokens)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Autenticação bem-sucedida! Esta janela fechará automaticamente.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/auth/google/status", (req, res) => {
  const tokens = req.cookies.google_tokens;
  res.json({ connected: !!tokens });
});

app.post("/api/auth/google/logout", (req, res) => {
  res.setHeader('Set-Cookie', [
    `google_tokens=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`
  ]);
  res.json({ success: true });
});

app.post("/api/calendar/sync", async (req, res) => {
  let tokens = req.cookies.google_tokens;
  const headerTokens = req.headers['x-google-tokens'];
  
  if (!tokens && headerTokens) {
    tokens = headerTokens;
  }

  if (!tokens) {
    return res.status(401).json({ error: "Not connected to Google Calendar" });
  }

  const { event } = req.body;
  if (!event) {
    return res.status(400).json({ error: "Missing event data" });
  }

  try {
    const redirectUri = getRedirectUri(req);
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    
    const parsedTokens = typeof tokens === 'string' ? JSON.parse(tokens) : tokens;
    auth.setCredentials(parsedTokens);

    const calendar = google.calendar({ version: "v3", auth });
    const CALENDAR_ID = "dftpcksnmd2f2mdia52t3ibeqc@group.calendar.google.com";

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start,
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: event.end,
          timeZone: "America/Sao_Paulo",
        },
      },
    });

    res.json({ success: true, eventId: response.data.id });
  } catch (error: any) {
    console.error("Error syncing to Google Calendar:", error);
    if (error.code === 401) {
        res.setHeader('Set-Cookie', [
            `google_tokens=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`
        ]);
        return res.status(401).json({ error: "Session expired. Please reconnect." });
    }
    res.status(500).json({ error: "Failed to sync event" });
  }
});

app.put("/api/calendar/sync/:eventId", async (req, res) => {
  let tokens = req.cookies.google_tokens;
  const headerTokens = req.headers['x-google-tokens'];
  
  if (!tokens && headerTokens) {
    tokens = headerTokens;
  }

  if (!tokens) {
    return res.status(401).json({ error: "Not connected to Google Calendar" });
  }

  const { eventId } = req.params;
  const { event } = req.body;

  try {
    const redirectUri = getRedirectUri(req);
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    
    const parsedTokens = typeof tokens === 'string' ? JSON.parse(tokens) : tokens;
    auth.setCredentials(parsedTokens);

    const calendar = google.calendar({ version: "v3", auth });
    const CALENDAR_ID = "dftpcksnmd2f2mdia52t3ibeqc@group.calendar.google.com";

    const response = await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId: eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start,
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: event.end,
          timeZone: "America/Sao_Paulo",
        },
      },
    });

    res.json({ success: true, eventId: response.data.id });
  } catch (error: any) {
    console.error("Error updating Google Calendar event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

app.delete("/api/calendar/sync/:eventId", async (req, res) => {
  let tokens = req.cookies.google_tokens;
  const headerTokens = req.headers['x-google-tokens'];
  
  if (!tokens && headerTokens) {
    tokens = headerTokens;
  }

  if (!tokens) {
    return res.status(401).json({ error: "Not connected to Google Calendar" });
  }

  const { eventId } = req.params;

  try {
    const redirectUri = getRedirectUri(req);
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    
    const parsedTokens = typeof tokens === 'string' ? JSON.parse(tokens) : tokens;
    auth.setCredentials(parsedTokens);

    const calendar = google.calendar({ version: "v3", auth });
    const CALENDAR_ID = "dftpcksnmd2f2mdia52t3ibeqc@group.calendar.google.com";

    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: eventId,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting Google Calendar event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

app.post("/api/whatsapp/send", async (req, res) => {
  const { chatId, text, image, apiUrl, apiKey, session } = req.body;
  console.log(`[WhatsApp API] Request received for chatId: ${chatId}`);
  
  const baseApiUrl = apiUrl || process.env.WHATSAPP_API_URL || 'https://waha.hoperiseprodutora.com/api';
  const apiToken = apiKey || process.env.WHATSAPP_API_KEY || 'hope_waha_key';
  const sessionName = session || 'default';

  if (!chatId || (!text && !image)) {
    console.error("[WhatsApp API] Missing chatId, text or image");
    return res.status(400).json({ error: "Missing chatId, text or image" });
  }

  try {
    const isImage = !!image;
    const endpoint = isImage ? 'sendImage' : 'sendText';
    
    // Normalize URL: remove trailing slashes
    const normalizedBaseUrl = baseApiUrl.replace(/\/+$/, "");
    const targetUrl = `${normalizedBaseUrl}/${endpoint}`;
    
    console.log(`[WhatsApp API] Attempting to fetch: ${targetUrl} (Session: ${sessionName})`);
    
    const payload: any = {
      session: sessionName,
      chatId,
    };

    if (isImage) {
      const base64Data = image.split(',')[1] || image;
      payload.file = {
        data: base64Data,
        mimetype: 'image/jpeg',
        filename: 'confirmacao.jpg'
      };
      payload.caption = text;
    } else {
      payload.text = text;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased to 45s

    let response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiToken
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      console.error(`[WhatsApp API] Fetch failed to ${targetUrl}:`, fetchError);
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ error: "WhatsApp API timeout (45s). The server might be slow or unreachable." });
      }
      throw fetchError; // Re-throw to be caught by outer catch
    }
    
    clearTimeout(timeoutId);

    console.log(`[WhatsApp API] Response status: ${response.status}`);
    let data = await response.json();
    console.log(`[WhatsApp API] Response data:`, JSON.stringify(data).slice(0, 200) + "...");
    
    // Fallback for WAHA Free version (NOWEB engine doesn't support media in free version)
    // We check for 422 status which usually means media is restricted or invalid
    if (!response.ok && response.status === 422) {
      const errorMsg = JSON.stringify(data);
      const isPlusVersionError = errorMsg.includes("Plus version");
      
      if ((isPlusVersionError || isImage) && text && text.trim()) {
        console.log(`[WhatsApp API] Info: Media restricted by WAHA version/engine. Attempting text-only fallback...`);
        
        const textUrl = `${baseApiUrl}/sendText`;
        try {
          const textResponse = await fetch(textUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': apiToken
            },
            body: JSON.stringify({
              session: sessionName,
              chatId,
              text: text
            })
          });
          
          const textData = await textResponse.json();
          if (textResponse.ok) {
            console.log("[WhatsApp API] Fallback text message sent successfully.");
            return res.json({ 
              ...textData, 
              _fallback: true,
              _warning: "O texto foi enviado, mas a imagem não. Motivo: Sua versão do WAHA (engine NOWEB) exige a versão 'Plus' para mídias. \n\nPara enviar imagens na versão gratuita: Mude a engine da sua sessão para 'WEBJS' no painel do WAHA." 
            });
          } else {
            console.error("[WhatsApp API] Fallback text message also failed:", textData);
            return res.status(textResponse.status).json(textData);
          }
        } catch (fallbackError: any) {
          console.error("[WhatsApp API] Error during fallback attempt:", fallbackError);
        }
      } else if (isImage && (!text || !text.trim())) {
        // If it was only an image and it failed due to version, we can't fallback to text
        return res.status(422).json({
          ...data,
          _warning: "A imagem não pôde ser enviada. Motivo: Sua versão do WAHA (engine NOWEB) exige a versão 'Plus' para mídias. \n\nPara enviar imagens na versão gratuita: Mude a engine da sua sessão para 'WEBJS' no painel do WAHA."
        });
      }
    }

    if (!response.ok) {
      // Don't log as error if it's the expected 422 we already handled (though we returned early above)
      console.error("[WhatsApp API] Target API returned error:", data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error: any) {
    console.error("[WhatsApp API] Error sending WhatsApp message via API:", error);
    const detail = error.cause ? ` (Cause: ${error.cause.message || error.cause})` : "";
    res.status(500).json({ error: "Failed to send WhatsApp message: " + error.message + detail });
  }
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global error handler:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*path", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
