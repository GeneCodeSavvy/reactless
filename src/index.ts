import { render } from './react-dom';
import App from './app';

const rootElement = document.getElementById('root');

if (rootElement) {
    render(rootElement, App);
} else {
    console.error('Root element not found');
}
