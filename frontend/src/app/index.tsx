import { useEffect } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { animatedSvgString } from '../components/animated-svg-string';

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.8, 400);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/customer-dashboard');
    }, 4500); // 4.5 seconds splash screen to ensure animation finishes playing
    return () => clearTimeout(timer);
  }, [router]);

  const webviewHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            background-color: transparent; 
          }
          svg {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
          }
        </style>
      </head>
      <body>
        ${animatedSvgString}
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <Image
          source="/buffer-aniamted.svg"
          style={{ width: logoSize, height: logoSize }}
          contentFit="contain"
        />
      ) : (
        <View style={{ width: logoSize, height: logoSize }}>
          <WebView
            source={{ html: webviewHtml }}
            style={{ backgroundColor: 'transparent' }}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            originWhitelist={['*']}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
});
