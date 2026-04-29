"""
fraud_detection/app.py
ElectionChain — AI Fraud Detection Microservice
"""

import os
import logging
import numpy as np
from flask import Flask, request, jsonify
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

app = Flask(__name__)

MODEL_PATH  = os.getenv("MODEL_PATH",  "fraud_model.pkl")
SCALER_PATH = os.getenv("SCALER_PATH", "fraud_scaler.pkl")

# Features: [timeDiff, attempts, ipFrequency, activityCount]
NORMAL = [
    [300,1,1,1],[450,1,1,2],[600,1,2,3],[500,1,1,1],[800,1,1,2],
    [350,1,1,1],[700,1,2,3],[400,1,1,1],[550,1,1,2],[900,1,1,1],
    [420,1,1,1],[480,1,1,2],[620,1,1,2],[750,1,2,3],[310,1,1,1],
    [660,1,1,2],[580,1,2,2],[440,1,1,1],[720,1,1,3],[390,1,1,1],
]

SUSPICIOUS = [
    [2,9,50,80],[1,10,100,200],[5,8,75,90],[3,7,60,100],
    [4,12,80,150],[10,6,40,70],[1,15,200,300],[6,9,55,95],
    [2,11,90,120],[8,7,45,85],[3,10,70,110],[5,13,85,160],
]

TRAIN_DATA = np.array(NORMAL + SUSPICIOUS)


def train_model():
    scaler = StandardScaler()
    X = scaler.fit_transform(TRAIN_DATA)
    model = IsolationForest(
        n_estimators=300,
        contamination=float(len(SUSPICIOUS)) / len(TRAIN_DATA),
        random_state=42,
        max_samples="auto",
    )
    model.fit(X)
    joblib.dump(model,  MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    log.info("Trained on %d samples (normal=%d suspicious=%d)", len(TRAIN_DATA), len(NORMAL), len(SUSPICIOUS))
    return model, scaler


def load_model():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        log.info("Loading model from disk")
        return joblib.load(MODEL_PATH), joblib.load(SCALER_PATH)
    return train_model()


model, scaler = load_model()


def features_from(data):
    return np.array([[
        float(data["timeDiff"]),
        float(data["attempts"]),
        float(data.get("ipFrequency",   1)),
        float(data.get("activityCount", 1)),
    ]])


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "IsolationForest+StandardScaler"}), 200


@app.route("/predict", methods=["POST"])
def predict():
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "Invalid JSON"}), 400
    missing = {"timeDiff", "attempts"} - payload.keys()
    if missing:
        return jsonify({"error": f"Missing: {missing}"}), 422

    try:
        raw = features_from(payload)
    except (ValueError, TypeError) as e:
        return jsonify({"error": str(e)}), 422

    X      = scaler.transform(raw)
    pred   = model.predict(X)[0]
    score  = float(model.decision_function(X)[0])
    result = "SUSPICIOUS" if pred == -1 else "NORMAL"

    # Rule-based override for clear fraud signals
    time_diff      = raw[0][0]
    attempts       = raw[0][1]
    ip_frequency   = raw[0][2]
    activity_count = raw[0][3]

    if attempts >= 5 and time_diff <= 30:
        result = "SUSPICIOUS"
    if ip_frequency >= 20:
        result = "SUSPICIOUS"
    if activity_count >= 50:
        result = "SUSPICIOUS"
    if attempts >= 8:
        result = "SUSPICIOUS"

    log.info("predict | %s | %s | score=%.4f", raw.tolist(), result, score)

    return jsonify({
        "prediction": result,
        "score":      round(score, 4),
        "features": {
            "timeDiff":      time_diff,
            "attempts":      attempts,
            "ipFrequency":   ip_frequency,
            "activityCount": activity_count,
        },
    }), 200


@app.route("/retrain", methods=["POST"])
def retrain():
    global model, scaler
    payload = request.get_json(silent=True)
    if not payload or "samples" not in payload:
        return jsonify({"error": "Provide {samples: [[...]]}"}), 400
    try:
        new      = np.array(payload["samples"], dtype=float)
        combined = np.vstack([TRAIN_DATA, new])
        scaler   = StandardScaler()
        X        = scaler.fit_transform(combined)
        model    = IsolationForest(n_estimators=300, contamination=0.35, random_state=42)
        model.fit(X)
        joblib.dump(model,  MODEL_PATH)
        joblib.dump(scaler, SCALER_PATH)
        return jsonify({"message": f"Retrained on {len(combined)} samples"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port  = int(os.getenv("FLASK_PORT", 5001))
    debug = false
    app.run(host="0.0.0.0", port=port, debug=debug)
