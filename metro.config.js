const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  // Firebase compatibility fixes for Expo SDK 54
  // Handle ESM modules that use import.meta
  config.resolver.sourceExts.push('cjs');
  config.resolver.unstable_enablePackageExports = false;

  // Exclude react-native-maps from web bundling (native-only module)
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && (moduleName === 'react-native-maps' || moduleName.startsWith('react-native-maps/'))) {
      return {
        type: 'empty',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  };

  return config;
})();

