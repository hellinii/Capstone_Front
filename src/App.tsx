import { BrowserRouter, Routes, Route } from "react-router";
import { routes } from "./routes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={<route.Component />} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
