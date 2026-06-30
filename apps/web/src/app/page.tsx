"use client";

import React from "react";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0d0e12",
        color: "#ffffff",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          padding: "40px",
          borderRadius: "16px",
          backgroundColor: "#16181f",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          border: "1px solid #232733",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "16px",
            background: "linear-gradient(45deg, #00d2ff, #0066ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "bold",
          }}
        >
          Plokymarket Portal
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#9aa0a6",
            lineHeight: "1.6",
            marginBottom: "24px",
          }}
        >
          The prediction marketplace initialization wizard is loading. Please configure your environment variables and database connections to proceed with deployment.
        </p>
        <div
          style={{
            display: "inline-block",
            padding: "12px 24px",
            fontSize: "1rem",
            fontWeight: "600",
            color: "#ffffff",
            backgroundColor: "#0066ff",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onClick={() => alert("Portal configuration is pending.")}
        >
          Configure Environment
        </div>
      </div>
    </main>
  );
}
