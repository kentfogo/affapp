const LOG_ENABLED = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

export const logger = {
  info: (message: string, data?: any) => {
    if (LOG_ENABLED) {
      console.log(`ℹ️ ${message}`, data || '');
    }
  },

  error: (message: string, error?: any) => {
    if (LOG_ENABLED) {
      console.error(`❌ ${message}`, error || '');
    }
  },

  warn: (message: string, data?: any) => {
    if (LOG_ENABLED) {
      console.warn(`⚠️ ${message}`, data || '');
    }
  },

  success: (message: string, data?: any) => {
    if (LOG_ENABLED) {
      console.log(`✅ ${message}`, data || '');
    }
  },
};

