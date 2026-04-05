import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:7071";
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET || "local-dev-client-secret";

function App() {
  const [helloData, setHelloData] = useState(null);
  const [items, setItems] = useState([]);
  const [echoInput, setEchoInput] = useState("");
  const [echoResponse, setEchoResponse] = useState(null);
  const [medicalInput, setMedicalInput] = useState("");
  const [medicalResult, setMedicalResult] = useState(null);
  const [loading, setLoading] = useState("");
  const [authStatus, setAuthStatus] = useState("Authenticating...");
  const tokenRef = useRef(null);

  // Get JWT on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_secret: CLIENT_SECRET }),
        });
        if (!res.ok) throw new Error("Auth failed");
        const data = await res.json();
        tokenRef.current = data.token;
        setAuthStatus("Authenticated");
      } catch (err) {
        setAuthStatus("Auth failed: " + err.message);
      }
    };
    fetchToken();
  }, []);

  const authHeaders = (extra = {}) => ({
    ...(tokenRef.current && { Authorization: `Bearer ${tokenRef.current}` }),
    ...extra,
  });

  const fetchHello = async () => {
    setLoading("hello");
    try {
      const res = await fetch(`${API_BASE}/api/hello`, { headers: authHeaders() });
      const data = await res.json();
      setHelloData(data);
    } catch (err) {
      setHelloData({ error: err.message });
    }
    setLoading("");
  };

  const fetchItems = async () => {
    setLoading("items");
    try {
      const res = await fetch(`${API_BASE}/api/items`, { headers: authHeaders() });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      setItems([]);
      setEchoResponse({ error: err.message });
    }
    setLoading("");
  };

  const sendEcho = async () => {
    if (!echoInput.trim()) return;
    setLoading("echo");
    try {
      const res = await fetch(`${API_BASE}/api/echo`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ message: echoInput }),
      });
      const data = await res.json();
      setEchoResponse(data);
    } catch (err) {
      setEchoResponse({ error: err.message });
    }
    setLoading("");
  };

  const extractMedical = async () => {
    if (!medicalInput.trim()) return;
    setLoading("medical");
    setMedicalResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/structured`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ query: medicalInput }),
      });
      const data = await res.json();
      setMedicalResult(data);
    } catch (err) {
      setMedicalResult({ error: err.message });
    }
    setLoading("");
  };

  return (
    <div className="app">
      <h1>Azure Deploy Demo</h1>
      <p className="subtitle">React (Static Web App) + FastAPI (Function App)</p>

      {/* Hello Card */}
      <div className="card">
        <h2>GET /api/hello</h2>
        <button className="btn" onClick={fetchHello} disabled={loading === "hello"}>
          {loading === "hello" ? "Loading..." : "Say Hello"}
        </button>
        {helloData && (
          <div className="response-box">{JSON.stringify(helloData, null, 2)}</div>
        )}
      </div>

      {/* Items Card */}
      <div className="card">
        <h2>GET /api/items</h2>
        <button className="btn" onClick={fetchItems} disabled={loading === "items"}>
          {loading === "items" ? "Loading..." : "Fetch Items"}
        </button>
        {items.length > 0 && (
          <ul className="item-list">
            {items.map((item) => (
              <li key={item.id}>
                <span className={`badge ${item.done ? "done" : "pending"}`}>
                  {item.done ? "Done" : "Pending"}
                </span>
                {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Echo Card */}
      <div className="card">
        <h2>POST /api/echo</h2>
        <input
          className="echo-input"
          type="text"
          placeholder="Type a message to echo..."
          value={echoInput}
          onChange={(e) => setEchoInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendEcho()}
        />
        <button className="btn" onClick={sendEcho} disabled={loading === "echo"}>
          {loading === "echo" ? "Sending..." : "Send Echo"}
        </button>
        {echoResponse && (
          <div className="response-box">{JSON.stringify(echoResponse, null, 2)}</div>
        )}
      </div>

      {/* Medical Data Extraction Card */}
      <div className="card">
        <h2>POST /api/structured <span className="badge-ai">AI</span></h2>
        <p className="card-desc">Extract medical parameters from clinical text using GPT</p>
        <textarea
          className="medical-input"
          placeholder="Paste medical document text here... e.g., Patient John Smith, 45 year old male, diagnosed with Type 2 Diabetes. BP 130/85, HR 78 bpm."
          value={medicalInput}
          onChange={(e) => setMedicalInput(e.target.value)}
          rows={4}
        />
        <button className="btn btn-ai" onClick={extractMedical} disabled={loading === "medical"}>
          {loading === "medical" ? "Extracting..." : "Extract Medical Data"}
        </button>
        {medicalResult && !medicalResult.error && medicalResult.result && (
          <div className="medical-result">
            <div className="medical-grid">
              <div className="med-field"><span className="med-label">Patient</span><span className="med-value">{medicalResult.result.patient_name || "—"}</span></div>
              <div className="med-field"><span className="med-label">Age</span><span className="med-value">{medicalResult.result.age || "—"}</span></div>
              <div className="med-field"><span className="med-label">Gender</span><span className="med-value">{medicalResult.result.gender || "—"}</span></div>
              <div className="med-field"><span className="med-label">Diagnosis</span><span className="med-value">{medicalResult.result.diagnosis || "—"}</span></div>
              <div className="med-field"><span className="med-label">BP</span><span className="med-value">{medicalResult.result.blood_pressure || "—"}</span></div>
              <div className="med-field"><span className="med-label">Heart Rate</span><span className="med-value">{medicalResult.result.heart_rate || "—"}</span></div>
              <div className="med-field"><span className="med-label">Temperature</span><span className="med-value">{medicalResult.result.temperature || "—"}</span></div>
              <div className="med-field med-full"><span className="med-label">Medications</span><span className="med-value">{medicalResult.result.medications?.join(", ") || "—"}</span></div>
            </div>
            <p className="usage-info">Model: {medicalResult.model} | Tokens: {medicalResult.usage?.prompt_tokens + medicalResult.usage?.completion_tokens}</p>
          </div>
        )}
        {medicalResult && medicalResult.error && (
          <div className="response-box error-box">{medicalResult.error}</div>
        )}
      </div>

      <p className="status">
        API: {API_BASE} | JWT: {authStatus}
      </p>
    </div>
  );
}

export default App;
