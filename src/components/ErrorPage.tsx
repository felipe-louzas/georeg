import React from "react";
import "./ErrorPage.css";

export default function ErrorPage(props: { error: string }) {
  return (
    <div className="error-page">
      <img
        draggable="false"
        className="emoji"
        alt="🚨"
        src="https://s.w.org/images/core/emoji/14.0.0/svg/1f6a8.svg"
      />
      <h1>Error Occurred</h1>
      <p>
        <>{props.error}</>
      </p>
    </div>
  );
}
