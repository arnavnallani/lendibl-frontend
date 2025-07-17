import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('main.tsx executing...');
console.log('DOM root element:', document.getElementById("root"));

try {
  console.log('Creating React root...');
  const root = createRoot(document.getElementById("root")!);
  console.log('Rendering App component...');
  root.render(<App />);
  console.log('React render complete');
} catch (error) {
  console.error('React render failed:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial;">
      <h1>React Render Error</h1>
      <p>${error.toString()}</p>
      <p>Check browser console for details</p>
    </div>
  `;
}
