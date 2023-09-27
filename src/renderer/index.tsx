import ReactDOM from 'react-dom/client';
import App from './App'
import store from "./store"
import { Provider } from 'react-redux';

const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
