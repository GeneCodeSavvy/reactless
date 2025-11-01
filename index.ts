import { render } from './reactless/vdom';
import App from './src/app';

const rootElement = document.getElementById('root');

if (rootElement) {
    render(rootElement, App());
} else {
    console.error('Root element not found');
}
