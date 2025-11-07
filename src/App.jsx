// App.jsx
import { BrowserRouter } from "react-router-dom";
import Router from "@/router/Router";
import NavBar from "@/components/NavBar";
import { Toaster } from "sonner";
import {LoadingProvider} from "@/components/LoadingProvider";

export default function App() {
  return (
    <>
    <BrowserRouter>
    <LoadingProvider >
      <Toaster richColors position="top-right"  />
      <NavBar />
      <div className="pt-14 bg-slate-50 dark:bg-slate-900 min-h-screen">
        <Router />
      </div>
      </LoadingProvider>
    </BrowserRouter>
    </>
  );
}
