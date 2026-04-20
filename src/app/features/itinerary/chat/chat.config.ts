/**
 * Chat Feature Configuration
 * Centralized configuration for chat feature
 */

export const CHAT_CONFIG = {
  // WebSocket Configuration
  websocket: {
    // Base URL for WebSocket connection (without scheme)
    baseUrl: '/api/chat/itineraries',
    
    // Default reconnection settings
    maxReconnectAttempts: 5,
    reconnectDelay: 3000, // ms
    
    // Message timeouts
    typingIndicatorTimeout: 3000, // ms
    
    // Typing indicator debounce
    typingDebounceDelay: 1000 // ms
  },

  // REST API Configuration
  api: {
    baseUrl: '/api/itineraries',
    
    // Default pagination
    defaultPageSize: 20,
    defaultPage: 0,
    
    // Maximum message length
    maxMessageLength: 5000
  },

  // UI Configuration
  ui: {
    // Message item styling
    messagePreviewLength: 100, // Characters to preview when truncating
    
    // Avatar colors (used in round-robin)
    avatarColors: [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#FFA07A', // Light Salmon
      '#98D8C8', // Mint
      '#F7DC6F', // Yellow
      '#BB8FCE', // Purple
      '#85C1E2'  // Light Blue
    ],
    
    // Message bubble border radius
    messageBorderRadius: '12px',
    
    // Auto-scroll to bottom behavior
    autoScrollToBottom: true,
    
    // Show timestamps
    showTimestamps: true,
    
    // Show user avatars
    showAvatars: true,
    
    // Show online status
    showOnlineStatus: true,
    
    // Animation duration (ms)
    animationDuration: 300
  },

  // Feature Flags
  features: {
    // Enable/disable message editing
    enableMessageEditing: true,
    
    // Enable/disable message deletion
    enableMessageDeletion: true,
    
    // Enable/disable typing indicators
    enableTypingIndicators: true,
    
    // Enable/disable user presence (join/leave)
    enableUserPresence: true,
    
    // Enable/disable message search (future)
    enableMessageSearch: false,
    
    // Enable/disable message reactions (future)
    enableReactions: false,
    
    // Enable/disable file attachments (future)
    enableAttachments: false,
    
    // Enable/disable message pinning (future)
    enableMessagePinning: false,
    
    // Enable/disable read receipts (future)
    enableReadReceipts: false
  },

  // Error Messages
  errors: {
    connectionFailed: 'Failed to connect to chat. Please try again.',
    notACollaborator: 'You are not a collaborator in this itinerary.',
    messageNotFound: 'Message not found.',
    permissionDenied: 'You do not have permission to perform this action.',
    networkError: 'Network error. Please check your connection.',
    unknownError: 'An unknown error occurred. Please try again.',
    messageSendFailed: 'Failed to send message. Please try again.'
  },

  // Success Messages
  success: {
    messageSent: 'Message sent successfully',
    messageUpdated: 'Message updated successfully',
    messageDeleted: 'Message deleted successfully',
    connected: 'Connected to chat',
    reconnected: 'Reconnected to chat'
  },

  // Information Messages
  info: {
    connecting: 'Connecting to chat...',
    reconnecting: 'Reconnecting to chat...',
    typing: 'typing...',
    userJoined: 'joined the chat',
    userLeft: 'left the chat'
  },

  // Development Configuration
  development: {
    // Enable console logging
    enableLogging: true,
    
    // Log WebSocket messages
    logWebSocketMessages: true,
    
    // Log API calls
    logApiCalls: false,
    
    // Log state changes
    logStateChanges: false,
    
    // Simulate slow network (ms delay)
    slowNetworkDelay: 0
  }
};

/**
 * Environment-specific overrides
 * Can be overridden in environment files
 */
export const getEnvironmentConfig = (environment: string) => {
  const baseConfig = CHAT_CONFIG;

  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        development: {
          enableLogging: false,
          logWebSocketMessages: false,
          logApiCalls: false,
          logStateChanges: false,
          slowNetworkDelay: 0
        }
      };

    case 'staging':
      return {
        ...baseConfig,
        development: {
          enableLogging: true,
          logWebSocketMessages: false,
          logApiCalls: false,
          logStateChanges: false,
          slowNetworkDelay: 0
        }
      };

    case 'development':
    default:
      return baseConfig;
  }
};
