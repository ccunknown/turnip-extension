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
		"webhook": []
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
							"type": "string"
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
			}
		}
	}
};

module.exports = Defaults;
