const DEFAULT_LOCAL_BACKEND_URL = "http://localhost:8080";
const DEFAULT_DOCKER_BACKEND_URL = "http://server:8080";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ??
  (process.env.NODE_ENV === "production"
    ? DEFAULT_DOCKER_BACKEND_URL
    : DEFAULT_LOCAL_BACKEND_URL);

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";


export async function proxyAuthRequest(
  request: Request,
  endpoint: string,
  method: HttpMethod = request.method as HttpMethod,
) {
  if (!BACKEND_API_URL) {
    return new Response(
      JSON.stringify({
        message: "La variable d'environnement BACKEND_API_URL est requise.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const targetUrl = new URL(endpoint, BACKEND_API_URL);

  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();

  const headers = new Headers();

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  }

  const cookies = request.headers.get("cookie");
  if (cookies) {
    headers.set("cookie", cookies);
  }

  const frontendOrigin = request.headers.get("x-frontend-origin")
  if (frontendOrigin) {
    headers.set("x-frontend-origin", frontendOrigin)
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();

      if (lowerKey === "set-cookie") {
        responseHeaders.append("set-cookie", value);
        return;
      }

      if (lowerKey === "content-length" || lowerKey === "connection") {
        return;
      }

      responseHeaders.set(key, value);
    });

    if (!responseHeaders.has("content-type")) {
      responseHeaders.set("content-type", "application/json");
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(
      "[proxyAuthRequest] Échec de la communication avec le backend:",
      error,
    );

    return new Response(
      JSON.stringify({
        message:
          "Impossible de joindre le service d'authentification. Réessayez ultérieurement.",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
