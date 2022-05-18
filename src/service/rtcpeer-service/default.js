const defaultConfig = {
  "server": {
    "config": {
      "ice": {
        "iceServers": [
          {
            "urls": [
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302"
            ]
          }
        ],
        "iceCandidatePoolSize": 10
      }
    }
  },
  "session": {
    "handshake": {
      // Handshake interval.
      "period": 3000,
      // Counter of continuous fail handshake to be abort session.
      "abortcountdown": 5
    }
  },
  "channel": {
    "callrespond": {
      "timeout": 3000
    }
  }
};

module.exports = defaultConfig;