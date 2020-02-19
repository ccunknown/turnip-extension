'use strict';

var defaultConfig = {
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
		"required": [],
		"properties": {
			"account": {
				"type": "object",
				"required": [],
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
						"type": "string"
					},
					"jwt": {
						"type": "string"
					}
				}
			},
			"webhook": {
				"type": "array",
				"items": {
					"type": "object",
					"required": [
						"name",
						"verify",
						"url",
						"method"
					],
					"preperties": {
						"name": {
							"type": "string"
						},
						"description": {
							"type": "string"
						},
						"verify": {
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
						"header": {
							"type": "array",
							"items": {
								"type": "object",
								"required": [
									"key",
									"value"
								],
								"properties": {
									"key": {
										"type": "string"
									},
									"value": {
										"type": "string"
									}
								}
							}
						},
						"payload": {
							"type": "string"
						}
					}
				}
			}
		}
	}
};

module.exports = defaultConfig;
