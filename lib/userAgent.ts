export const isInAppBrowser = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const targetUserAgents = [
    'kakao',
    'naver',
    'line',
    'instagram',
    'facebook',
    'twitter',
    'daum',
  ];

  return targetUserAgents.some((agent) => userAgent.includes(agent));
};

export const handleInAppBrowser = () => {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isAndroid = /android/i.test(userAgent);

  if (isAndroid) {
    // Android: Try to open in Chrome via intent
    const url = window.location.href.replace(/^https?:\/\//, '');
    const intentUrl = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    return true;
  } else {
    // iOS/Others: Just return true to let the UI show a guide
    // (Since we can't force open external browser easily on iOS without user interaction or specific schemes if not supported)
    return true;
  }
};
