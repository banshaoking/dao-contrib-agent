const API_BASE = "/api";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "API request failed");
    }

    return data;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ========================================
// Contributions API
// ========================================

export const contributionsApi = {
  getAll: (params?: {
    platform?: string;
    type?: string;
    contributor?: string;
    settled?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return fetchApi(`/contributions${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => fetchApi(`/contributions/${id}`),

  fetchFromGithub: (data: {
    owner: string;
    repo: string;
    username: string;
    address: string;
    since?: string;
  }) =>
    fetchApi("/contributions/github", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  addManual: (contributions: any[]) =>
    fetchApi("/contributions/manual", {
      method: "POST",
      body: JSON.stringify({ contributions }),
    }),

  analyze: (contributionIds: string[], ruleId?: string) =>
    fetchApi("/contributions/analyze", {
      method: "POST",
      body: JSON.stringify({ contributionIds, ruleId }),
    }),

  getStats: () => fetchApi("/contributions/stats/overview"),
};

// ========================================
// Rules API
// ========================================

export const rulesApi = {
  getAll: (active?: boolean) => {
    const query = active !== undefined ? `?active=${active}` : "";
    return fetchApi(`/rules${query}`);
  },

  getById: (id: string) => fetchApi(`/rules/${id}`),

  create: (data: {
    name: string;
    description: string;
    weights: { type: string; weight: number; description: string }[];
    baseReward: string;
    maxRewardPerContributor: string;
  }) =>
    fetchApi("/rules", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi(`/rules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi(`/rules/${id}`, {
      method: "DELETE",
    }),

  activate: (id: string) =>
    fetchApi(`/rules/${id}/activate`, {
      method: "POST",
    }),

  calculatePreview: (ruleId: string, contributionTypes: string[]) =>
    fetchApi("/rules/calculate-preview", {
      method: "POST",
      body: JSON.stringify({ ruleId, contributionTypes }),
    }),
};

// ========================================
// Settlements API
// ========================================

export const settlementsApi = {
  getAll: (params?: { status?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return fetchApi(`/settlements${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => fetchApi(`/settlements/${id}`),

  execute: (data: { ruleId: string; contributionIds: string[] }) =>
    fetchApi("/settlements/execute", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  recordOnChain: (contributions: any[]) =>
    fetchApi("/settlements/record", {
      method: "POST",
      body: JSON.stringify({ contributions }),
    }),

  getTxStatus: (txHash: string) => fetchApi(`/settlements/tx/${txHash}`),

  getContractBalance: () => fetchApi("/settlements/balance/contract"),
};

// ========================================
// Reports API
// ========================================

export const reportsApi = {
  generate: (contributionIds: string[], ruleId?: string) =>
    fetchApi("/reports/generate", {
      method: "POST",
      body: JSON.stringify({ contributionIds, ruleId }),
    }),

  getSummary: (startDate?: string, endDate?: string) =>
    fetchApi("/reports/summary", {
      method: "POST",
      body: JSON.stringify({ startDate, endDate }),
    }),

  explain: (contributionId: string, aiScore: number, aiReason: string) =>
    fetchApi("/reports/explain", {
      method: "POST",
      body: JSON.stringify({ contributionId, aiScore, aiReason }),
    }),
};

// ========================================
// Health API
// ========================================

export const healthApi = {
  check: () => fetchApi("/health"),
};

export default {
  contributions: contributionsApi,
  rules: rulesApi,
  settlements: settlementsApi,
  reports: reportsApi,
  health: healthApi,
};
