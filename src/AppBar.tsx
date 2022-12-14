import React, { useEffect } from "react";

import { useCelo, NetworkNames } from "@celo/react-celo";

export default function AppBar() {
  const { connect, address, disconnect, network, updateNetwork, networks } =
    useCelo();

  useEffect(() => {
    const newNetwork = networks.find((n) => n.name === NetworkNames.Alfajores);
    if (newNetwork) {
      updateNetwork(newNetwork);
    }
  }, [networks, updateNetwork]);

  return (
    <nav className="navbar navbar-expand-lg bg-light border-bottom border-secondary">
      <div className="container-fluid">
        <button className="navbar-brand p-0 btn btn-link">
          <img
            src="/brasil_o.png"
            alt="Logo"
            width="24"
            height="24"
            className="me-2 d-inline-block align-text-bottom"
          />
          <strong>GeoReg</strong>
        </button>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>
          {/*
          <form className="d-flex" role="search">
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search"
              aria-label="Search"
            />
            <button className="btn btn-outline-success" type="submit">
              Search
            </button>
          </form>
          */}
          <div className="btn btn-outline-dark me-3">
            <small>{network.name}</small>
          </div>
          {address ? (
            <div className="dropdown">
              <button
                className="btn btn-outline-dark dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <small>{address}</small>
              </button>
              <ul className="dropdown-menu  dropdown-menu-end">
                <li>
                  <button
                    className="btn btn-link dropdown-item"
                    onClick={disconnect}
                  >
                    Desconectar
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <button className="btn btn-outline-success" onClick={connect}>
              Connectar wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
