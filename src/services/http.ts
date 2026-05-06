export type ApiError = {
  status: number;
  message: string;
};

async function parseJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  const data = (await parseJsonSafely(response)) as { error?: string } | null;

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;

    const error = new Error(message);
    (error as any).status = response.status;

    throw error;
  }

  return data as T;
}
