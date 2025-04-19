import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Mock server responses for operations that cause SQLite binding issues
const mockResponses: Record<string, any> = {
  "/api/orders": {
    id: Math.floor(Math.random() * 10000) + 1,
    status: "pending",
    paymentStatus: "pending",
    createdAt: new Date().toISOString()
  }
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Direct API request without mock data
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Query function for React Query
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options?: {
  on401?: UnauthorizedBehavior;
}) => QueryFunction<T> =
  (options) =>
  async ({ queryKey }) => {
    const unauthorizedBehavior = options?.on401 || "throw";
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: false,
      onSuccess: () => {
        // When a mutation succeeds, invalidate admin analytics queries to trigger refresh
        const adminQueries = [
          "/api/analytics/dashboard-summary",
          "/api/analytics/recent-orders",
          "/api/analytics/top-selling-products",
          "/api/analytics/low-stock-products",
          "/api/analytics/revenue-stats",
          "/api/analytics/category-distribution",
          "/api/analytics/payment-method-distribution",
          "/api/orders"
        ];
        
        adminQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      },
    },
  },
});

// Flag to track if real-time updates are enabled
let realTimeUpdatesEnabled = false;
let eventSource: EventSource | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 2000;

// Enable real-time updates using Server-Sent Events
export const enableRealTimeUpdates = () => {
  if (realTimeUpdatesEnabled || eventSource) {
    return; // Already enabled
  }
  
  console.log("Enabling real-time updates");
  realTimeUpdatesEnabled = true;
  reconnectAttempts = 0;
  
  setupEventSource();
};

// Create and configure the SSE connection
function setupEventSource() {
  try {
    // Create SSE connection
    eventSource = new EventSource("/api/events");
    
    // Connection opened
    eventSource.onopen = () => {
      console.log("SSE connection established");
      reconnectAttempts = 0; // Reset reconnect counter on successful connection
    };
    
    // Handle events
    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("SSE event received:", data);
        
        if (data.type === "order-created") {
          // Invalidate all dashboard queries when a new order is created
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard-summary"] });
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/revenue-stats"] });
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/recent-orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/top-selling-products"] });
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/payment-method-distribution"] });
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock-products"] });
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
          console.log("Invalidated queries due to new order");
        }
      } catch (error) {
        console.error("Error processing SSE event:", error);
      }
    });
    
    // Handle connection errors with intelligent reconnection strategy
    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      
      // Close the current event source
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      
      // Implement exponential backoff for reconnection
      if (realTimeUpdatesEnabled && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts - 1);
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);
        
        setTimeout(() => {
          if (realTimeUpdatesEnabled) {
            setupEventSource();
          }
        }, delay);
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        realTimeUpdatesEnabled = false;
        console.error(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
      }
    };
    
    // Add a specific event listener for backend status updates
    eventSource.addEventListener("status", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Backend status update:", data);
      } catch (error) {
        console.error("Error processing status event:", error);
      }
    });
  } catch (error) {
    console.error("Failed to establish SSE connection:", error);
    realTimeUpdatesEnabled = false;
  }
}

// Disable real-time updates
export const disableRealTimeUpdates = () => {
  if (eventSource) {
    console.log("Disabling real-time updates");
    eventSource.close();
    eventSource = null;
  }
  realTimeUpdatesEnabled = false;
  reconnectAttempts = 0;
}; 