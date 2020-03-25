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
    "webhook": [],
    "history": {
      "limit": 10
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
          "limit"
        ],
        "properties": {
          "limit": {
            "type": "number"
          }
        }
      }
    }
  }
};

module.exports = Defaults;