import { render, createElement } from './vdom';
import App from '../src/app';

const rootElement = document.getElementById('root');

const app = App()

if (rootElement) {
    render(rootElement, app);
} else {
    console.error('Root element not found');
}
