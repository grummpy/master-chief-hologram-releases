const MICROPHONE_SETTINGS_URL = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone';
function isGranted(status) { return status === 'granted'; }
function recoveryMessage(status) {
  if (status === 'denied' || status === 'restricted') return 'Microphone access is disabled in macOS. Open Microphone Settings, enable Master Chief Hologram, then return and press MIC.';
  if (status === 'not-determined') return 'Microphone permission has not been decided. Press MIC to request access.';
  return 'Microphone access is unavailable. Check the selected input device and macOS privacy settings.';
}
module.exports = { MICROPHONE_SETTINGS_URL, isGranted, recoveryMessage };
