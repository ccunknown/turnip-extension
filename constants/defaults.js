'use strict';

var Defaults = {
  "extension": {
    "name": "turnip",
    "version": "0.1.0"
  },
  "config": {
    "account": {
      "email": "turnip.extension@extension.com",
      "name": "turnip.extension",
      "password": null,
      "jwt": null
    },
    "service": [
      {
        "id": "network-service",
        "enable": true,
        "status": "unknow",
        "description": "This service use to check internet connection and redis (install if not exist)."
      },
      {
        "id": "channel-service",
        "enable": true,
        "status": "unknow",
        "description": "This service use to create WebRTC channel for real-time communicate between backend and frontend."
      },
      {
        "id": "history-service",
        "enable": true,
        "status": "unknow"
      },
      {
        "id": "wsocket-service",
        "enable": true,
        "status": "unknow",
        "description": "This service use to connect self gateway with account which is provide by user."
      },
      {
        "id": "webhook-service",
        "enable": true,
        "status": "unknow",
        "dependencies": [
          "history-service",
          "wsocket-service"
        ]
      }
    ],
    "channel": {
      "server": {
        "config": {
          "ice": {
            "iceServer": [
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
      "abort": {
        "successRate": 0.1,
        "period": 30000
      }
    },
    "job": {
      "queue": {
        "maxlength": 100,
        "timeout": 2000
      },
      "process": {
        "concurrency": 5,
        "timeout": 5000
      },
      "request": {
        "timeout": 5000
      }
    },
    "network": {
      "check": {
        "endpoint": [
          "www.google.com",
          "www.wot.meca.in.th"
        ]
      },
      "redis": {
        "install": true,
        "endpoint": {
          "host": "localhost",
          "port": 6379,
          "secure": false
        }
      }
    },
    "webhook": [],
    "history": {
      "webhook": {
        "limit": 10
      },
      "things": {
        "database": {
          "sqlite": {
            "fname": `things-history.sqlite3`
          },
          "record": {
            // Time limit (Second)
            // month: 2592000
            // week: 604800
            // day: 86400
            // hour: 3600
            "duration": 2592000,
            "cleanup": {
              "interval": 300
            }
          },
        },
        "job": {
          // Update timeout (milli-second)
          "timeout": 5000
        }
      }
    }
  },
  "schema": {
    "type": "object",
    "required": ["account", "webhook"],
    "additionalProperties": false,
    "properties": {
      "account": {
        "type": "object",
        "required": ["email", "name", "password", "jwt"],
        "additionalProperties": false,
        "properties": {
          "email": {
            "type": "string",
            "default": "turnip.extension@extension.com"
          },
          "name": {
            "type": "string",
            "default": "turnipExtension"
          },
          "password": {
            "type": ["string", "null"]
          },
          "jwt": {
            "type": ["string", "null"]
          }
        }
      },
      "service":{
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "id",
            "enable",
            "status"
          ],
          "additionalProperties": false,
          "properties": {
            "id": {
              "type": "string"
            },
            "description": {
              "type": "string",
              "default": ""
            },
            "dependencies": {
              "type": "array",
              "default": [],
              "items": {
                "type": "string"
              }
            },
            "enable": {
              "type": "boolean",
              "default": false
            },
            "status": {
              "type": "string",
              "enum": [
                "enabled",
                "unknow",
                "disabled"
              ],
            },
            "reason": {
              "type": "string",
              "default": ""
            }
          }
        }
      },
      "channel": {
        "type": "object",
        "required": [ "server" ],
        "additionalProperties": false,
        "properties": {
          "server": {
            "type": "object",
            "required": [ "config" ],
            "additionalProperties": false,
            "properties": {
              "config": {
                "type": "object",
                "required": [ "ice" ],
                "additionalProperties": false,
                "properties": {
                  "ice": {
                    "type": "object",
                    "required": [ "iceServer" ],
                    "additionalProperties": false,
                    "properties": {
                      "iceServer": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "required": [ "urls" ],
                          "additionalProperties": false,
                          "properties": {
                            "urls": {
                              "type": "array",
                              "items": {
                                "type": "string"
                              }
                            }
                          }
                        }
                      },
                      "iceCandidatePoolSize": {
                        "type": "number"
                      }
                    }
                  }
                }
              }
            }
          },
          "abort": {
            "type": "object",
            "required": [ "successRate", "period" ],
            "additionalProperties": false,
            "properties": {
              "successRate": {
                "type": "number"
              },
              "period": {
                "type": "number"
              }
            }
          }
        }
      },
      "job": {
        "type": "object",
        "required": [],
        "additionalProperties": false,
        "properties": {
          "queue": {
            "type": "object",
            "required": ["maxlength", "timeout"],
            "additionalProperties": false,
            "properties": {
              "maxlength": {
                "type": "number",
                "default": 100
              },
              "timeout": {
                "type": "number",
                "default": 2000
              }
            }
          },
          "process": {
            "type": "object",
            "required": ["concurrency", "timeout"],
            "additionalProperties": false,
            "properties": {
              "concurrency": {
                "type": "number",
                "default": 5
              },
              "timeout": {
                "type": "number",
                "default": 5000
              }
            }
          },
          "request": {
            "type": "object",
            "required": ["timeout"],
            "additionalProperties": false,
            "properties": {
              "timeout": {
                "type": "number",
                "default": 5000
              }
            }
          }
        }
      },
      "network": {
        "type": "object",
        "required": ["check", "redis"],
        "additionalProperties": false,
        "properties": {
          "check": {
            "type": "object",
            "required": ["endpoint"],
            "additionalProperties": false,
            "properties": {
              "endpoint": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            }
          },
          "redis": {
            "type": "object",
            "required": ["install", "endpoint"],
            "additionalProperties": false,
            "properties": {
              "install": {
                "type": "boolean",
                "default": true
              },
              "endpoint": {
                "type": "object",
                "required": ["host", "port"],
                "additionalProperties": false,
                "properties": {
                  "host": {
                    "type": "string",
                    "default": "localhost"
                  },
                  "port": {
                    "type": "number",
                    "default": 6379
                  },
                  "username": {
                    "type": "string"
                  },
                  "password": {
                    "type": "string"
                  },
                  "secure": {
                    "type": "boolean",
                    "default": false
                  }
                }
              }
            }
          }
        }
      },
      "webhook": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "name",
            "description",
            "enable",
            "unverify",
            "url",
            "method"
          ],
          "additionalProperties": false,
          "properties": {
            "name": {
              "type": "string",
              "pattern": "^[a-zA-Z-_0-9]{4,40}$"
            },
            "description": {
              "type": "string"
            },
            "enable": {
              "type": "boolean",
              "default": true
            },
            "unverify": {
              "type": "boolean",
              "default": false
            },
            "url": {
              "type": "string",
              "pattern": "^https?:\/\/.*$"
            },
            "method": {
              "type": "string",
              "enum": [
                "GET",
                "HEAD",
                "POST",
                "PUT",
                "DELETE",
                "CONNECT",
                "OPTIONS",
                "TRACE",
                "PATCH"
              ],
              "default": "POST"
            },
            "headers": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "key",
                  "value"
                ],
                "additionalProperties": false,
                "properties": {
                  "key": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  }
                }
              },
              "default": []
            },
            "payload": {
              "type": "string",
              "default": ""
            }
          }
        }
      },
      "history": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "webhook",
          "things"
        ],
        "properties": {
          "webhook": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "limit"
            ],
            "properties": {
              "limit": {
                "type": "number",
                "default": 10
              }
            }
          },
          "things": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "database",
              "job"
            ],
            "properties": {
              "database": {
                "type": "object",
                "required": [
                  "record"
                ],
                "additionalProperties": false,
                "properties": {
                  "sqlite": {
                    "type": "object",
                    "required": [
                      "fname"
                    ],
                    "additionalProperties": false,
                    "properties": {
                      "fname": {
                        "type": "string",
                        "default": "things-history.sqlite3"
                      }
                    }
                  },
                  "record": {
                    "type": "object",
                    "required": [
                      "duration",
                      "cleanup"
                    ],
                    "additionalProperties": false,
                    "properties": {
                      "duration": {
                        "type": "number",
                        "default": 3600
                      },
                      "cleanup": {
                        "type": "object",
                        "required": [
                          `interval`
                        ],
                        "additionalProperties": false,
                        "properties": {
                          "interval": {
                            "type": "number",
                            "default": 3600
                          }
                        }
                      }
                    }
                  },
                }
              },
              "job": {
                "type": "object",
                "required": [
                  "timeout"
                ],
                "additionalProperties": false,
                "properties": {
                  "timeout": {
                    "type": "number",
                    "default": 5000
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = Defaults;