import React from "react";
import "./Loader.css";

export default function Loader() {
  return (
    <section className="loader">
      <div className="bouncing-loader">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </section>
  );
}
