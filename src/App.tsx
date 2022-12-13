import React, { Suspense } from "react";
import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorPage from "./components/ErrorPage";
import MapPage from "./components/map/MapPage";
import AppBar from "./AppBar";
import { CeloProvider, Alfajores, NetworkNames } from "@celo/react-celo";
import "@celo/react-celo/lib/styles.css";
import { ToastContainer } from "react-toastify";

import "./App.css";

export default function App() {
  return (
    <CeloProvider
      dapp={{
        name: "GeoReg",
        description: "Registro de Imóveis Georeferenciados",
        url: "https://v2tutq-3000.preview.csb.app/",
        icon: "/logo512.png",
      }}
      networks={[Alfajores]}
      defaultNetwork={NetworkNames.Alfajores}
      connectModal={{
        // This options changes the title of the modal and can be either a string or a react element
        title: <span>Connecte sua Wallet</span>,
      }}
    >
      <ErrorBoundary fallback={(error) => <ErrorPage error={error.message} />}>
        <Suspense fallback={<Loader />}>
          <AppBar />
          <MapPage />
          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </Suspense>
      </ErrorBoundary>
    </CeloProvider>
  );
}
