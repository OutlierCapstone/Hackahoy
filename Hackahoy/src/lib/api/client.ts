// src/lib/api/client.ts

const BASE_URL =

  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://44.199.70.243:4000";



type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";



interface RequestOptions {

  method?: HttpMethod;

  body?: unknown;

  token?: string | null;

}



export async function apiRequest<T>(

  endpoint: string,

  options: RequestOptions = {}

): Promise<T> {

  const { method = "GET", body, token } = options;



  const headers: HeadersInit = {

    "Content-Type": "application/json",

  };



  if (token) {

    headers.Authorization = `Bearer ${token}`;

  }



  const res = await fetch(`${BASE_URL}${endpoint}`, {

    method,

    headers,

    body: body ? JSON.stringify(body) : undefined,

    credentials: "include",

  });



  if (!res.ok) {

    throw new Error(`API Error: ${res.status}`);

  }



  return (await res.json()) as T;

}