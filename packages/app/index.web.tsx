/// <reference lib="dom" />
import { AppRegistry, type RootTag } from 'react-native';
import App from './src/App';
import { registerServiceWorker } from './src/push/push-token';
import { name as appName } from './app.json';

const rootTag = document.getElementById('root');
if (rootTag === null) {
  throw new Error('index.html is missing the #root element');
}

registerServiceWorker();
AppRegistry.registerComponent(appName, () => App);
// react-native types model a native numeric root tag; react-native-web takes the DOM element.
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: rootTag as unknown as RootTag,
});
