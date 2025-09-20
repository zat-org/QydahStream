import * as signalR from "@microsoft/signalr";
import type { GameI, IStatics } from "~/models/game";

export interface GameStateChangedData {
  eventName: string;
  gameData: string;
  gameStatics?: string;
}

// Connection states
export enum ConnectionState {
  Disconnected = "Disconnected",
  Connecting = "Connecting", 
  Connected = "Connected",
  Reconnecting = "Reconnecting",
  Failed = "Failed"
}

// Connection configuration interface
export interface ConnectionConfig {
  socketUrl: string;
  withCredentials?: boolean;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  logLevel?: signalR.LogLevel;
}

// Event handler types
export type GameStateChangedHandler = (events: string, gameData: string, statics?: string) => void;
export type ConnectionErrorHandler = (error: string) => void;
export type ConnectionStateChangedHandler = (state: ConnectionState, error?: string) => void;

// Game connection utility class
export class GameConnection {
  private connection: signalR.HubConnection;
  private config: ConnectionConfig;
  private _connectionState = ref<ConnectionState>(ConnectionState.Disconnected);
  private _connectionError = ref<string | null>(null);
  private _reconnectAttempts = ref(0);
  
  // Event handlers
  private gameStateChangedHandler?: GameStateChangedHandler;
  private connectionErrorHandler?: ConnectionErrorHandler;
  private connectionStateChangedHandler?: ConnectionStateChangedHandler;

  constructor(config: ConnectionConfig) {
    this.config = {
      withCredentials: true,
      autoReconnect: true,
      maxReconnectAttempts: 5,
      logLevel: signalR.LogLevel.Information,
      ...config
    };

    this.connection = this.createConnection();
    this.setupConnectionEvents();
  }

  // Getters for reactive state
  get connectionState() {
    return readonly(this._connectionState);
  }

  get connectionError() {
    return readonly(this._connectionError);
  }

  get reconnectAttempts() {
    return readonly(this._reconnectAttempts);
  }

  get isConnected() {
    return computed(() => this._connectionState.value === ConnectionState.Connected);
  }

  get isConnecting() {
    return computed(() => 
      this._connectionState.value === ConnectionState.Connecting || 
      this._connectionState.value === ConnectionState.Reconnecting
    );
  }

  // Expose raw connection for stores to set up their own event listeners
  get rawConnection() {
    return this.connection;
  }

  // Create SignalR connection with configuration
  private createConnection(): signalR.HubConnection {
    const builder = new signalR.HubConnectionBuilder()
      .withUrl(this.config.socketUrl, {
        withCredentials: this.config.withCredentials,
      })
      .configureLogging(this.config.logLevel || signalR.LogLevel.Information);

    if (this.config.autoReconnect) {
      builder.withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.previousRetryCount === 0) {
            return 0;
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        }
      });
    }

    return builder.build();
  }

  // Setup connection event listeners
  private setupConnectionEvents(): void {
    this.connection.onclose((error) => {
      this._connectionState.value = ConnectionState.Disconnected;
      if (error) {
        this._connectionError.value = error.message;
        console.error("Connection closed due to error:", error);
      } else {
        console.log("Connection closed");
      }
      this.notifyConnectionStateChanged(this._connectionState.value, error?.message);
    });

    this.connection.onreconnecting((error) => {
      this._connectionState.value = ConnectionState.Reconnecting;
      this._reconnectAttempts.value++;
      console.log("Attempting to reconnect...", { 
        attempt: this._reconnectAttempts.value, 
        error 
      });
      this.notifyConnectionStateChanged(this._connectionState.value, error?.message);
    });

    this.connection.onreconnected((connectionId) => {
      this._connectionState.value = ConnectionState.Connected;
      this._connectionError.value = null;
      this._reconnectAttempts.value = 0;
      console.log("Reconnected successfully:", connectionId);
      this.notifyConnectionStateChanged(this._connectionState.value);
    });
  }

  // Setup SignalR event listeners - now handled by individual stores
  private setupEventListeners(): void {
    // Event listeners are now set up in individual stores for maximum flexibility
    // Stores can use: gameConnection.connection.on("EventName", handler)
    
    // Only keep essential connection error handling here
    this.connection.on("ConnectionError", (error: string) => {
      console.error("Server reported connection error:", error);
      this._connectionError.value = error;
      if (this.connectionErrorHandler) {
        this.connectionErrorHandler(error);
      }
    });
  }

  // Event handler registration methods (optional - stores can use rawConnection directly)
  onConnectionError(handler: ConnectionErrorHandler): void {
    this.connectionErrorHandler = handler;
  }

  onConnectionStateChanged(handler: ConnectionStateChangedHandler): void {
    this.connectionStateChangedHandler = handler;
  }

  // Notify connection state changes
  private notifyConnectionStateChanged(state: ConnectionState, error?: string): void {
    if (this.connectionStateChangedHandler) {
      this.connectionStateChangedHandler(state, error);
    }
  }

  // Main connection initialization function
  async initializeConnection(): Promise<void> {
    
      if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
          console.warn(
            `⚠️ Skipping initializeConnection because state = ${this.connection.state}`
      );
          return;
    }
    try {
        this._connectionState.value = ConnectionState.Connecting;
      this._connectionError.value = null;

      await this.connection.start();
      this._connectionState.value = ConnectionState.Connected;
      console.log("SignalR connection established");

      // Setup event listeners
      this.setupEventListeners();

    } catch (error) {
      this._connectionState.value = ConnectionState.Failed;
      this._connectionError.value = error instanceof Error ? error.message : "Connection failed";
      console.error("Failed to initialize connection:", error);
      this.notifyConnectionStateChanged(this._connectionState.value, this._connectionError.value);
      throw error;
    }
  }

  // Join game group methods
  async joinBoardGroup(playerTableId: string): Promise<string> {
    try {
      console.log("Joining board group:", { playerTableId });
      return await this.connection.invoke("AddToBoardGroup", playerTableId);
    } catch (error) {
      console.error("Failed to join board group:", error);
      throw error;
    }
  }

  async joinTournamentTableGroup(tourId: number, tableId: number): Promise<string> {
    try {
      console.log("Joining tournament table group:", { tourId, tableId });
      return await this.connection.invoke("AddToTournamentTableGroup", tourId, tableId);
    } catch (error) {
      console.error("Failed to join tournament table group:", error);
      throw error;
    }
  }

  // Manual reconnection function
  async reconnect(): Promise<void> {
    if (this._connectionState.value === ConnectionState.Connecting || 
        this._connectionState.value === ConnectionState.Reconnecting) {
      console.log("Connection already in progress");
      return;
    }

    try {
      this._connectionState.value = ConnectionState.Reconnecting;
      await this.connection.stop();
      await this.connection.start();
      this._connectionState.value = ConnectionState.Connected;
      console.log("Manual reconnection successful");
      this.notifyConnectionStateChanged(this._connectionState.value);
    } catch (error) {
      this._connectionState.value = ConnectionState.Failed;
      this._connectionError.value = error instanceof Error ? error.message : "Reconnection failed";
      console.error("Manual reconnection failed:", error);
      this.notifyConnectionStateChanged(this._connectionState.value, this._connectionError.value);
      throw error;
    }
  }

  // Cleanup function
  async cleanup(): Promise<void> {
    try {
      if (this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.stop();
      }
      this._connectionState.value = ConnectionState.Disconnected;
      console.log("Connection cleaned up");
      this.notifyConnectionStateChanged(this._connectionState.value);
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  // Get connection state
  getConnectionState(): ConnectionState {
    return this._connectionState.value;
  }

  // Invoke hub methods
  async invoke(methodName: string, ...args: any[]): Promise<any> {
    try {
      return await this.connection.invoke(methodName, ...args);
    } catch (error) {
      console.error(`Failed to invoke ${methodName}:`, error);
      throw error;
    }
  }
}

// Utility function to parse events from server (generic)
export const parseEvents = <T extends string>(eventName: string): T[] => {
  console.log("parseEvents", eventName);
  try {
    return eventName
      .split(",")
      .map(e => e.trim() as T)
      .filter(e => e); // Remove empty strings
  } catch (error) {
    console.error("Failed to parse events:", error);
    return [];
  }
};

// Factory function to create a game connection
export const createGameConnection = (socketUrl: string, options?: Partial<ConnectionConfig>): GameConnection => {
  return new GameConnection({
    socketUrl,
    ...options
  });
};
