import fetch from "node-fetch";
import { SPOTIFY_SECRET } from "$env/static/private";

const clientId = "f34a83c0460345769ab81d8491433902";
const clientSecret = SPOTIFY_SECRET;

export async function GET({ url }) {
  const code = url.searchParams.get("code");
  if (code) {
    return new Response(
      `<script>
                window.opener.spotifyCallback('${code}');
                window.close();
            </script>`,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }
  return new Response("No code provided", {
    status: 400,
  });
}

export async function POST({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
    });
  }

  try {
    const { code } = await request.json();
    const currentUrl = request.url;
    // Forcer HTTP pour l'URL de redirection si on est sur le serveur de dev
    const redirectUri = new URL("/api/spotify-auth", currentUrl)
      .toString()
      .replace("https://", "http://");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    if (data.error) {
      return new Response(JSON.stringify({ error: data.error }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}

export async function PUT({ request }) {
  try {
    const { refreshToken } = await request.json();

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    if (data.error) {
      return new Response(JSON.stringify({ error: data.error }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
