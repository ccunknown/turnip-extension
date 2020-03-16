let Errors = {};

const errDef = [
	{
		"name": "Http404",
		"super": (arg) => `Resource not found.`,
		"httpResponse": {
			"status": 404
		}
	},
	{
		"name": "AcceptOnlyJsonBody",
		"super": (arg) => `Content-type must be "application/json".`,
		"httpResponse": {
			"status": 406,
			"contentType": "text/plain",
			"contentIndex": "message"
		}
	},
	{
		"name": "RespondOnlyJsonType",
		"super": (arg) => `Server only respond with "application/json".`,
		"httpResponse": {
			"status": 406,
			"contentType": "text/plain",
			"contentIndex": "message"
		}
	},
	{
		"name": "ErrorParameterNotFound",
		"extends": Error,
		"super": (arg) => `Error process not found parameter "${arg}".`,
		"httpResponse": {
			"status": 500,
			"contentType": "text/plain",
			"contentIndex": "stack"
		}
	},
	{
		"name": "ErrorObjectNotReturn",
		"extends": Error,
		"super": (arg) => `Error object not return.`,
		"httpResponse": {
			"status": 500,
			"contentType": "text/plain",
			"contentIndex": "stack"
		}
	},
	{
		"name": "DatabaseObjectUndefined",
		"extends": Error,
		"super": (arg) => `Database object is ${arg}.`,
		"httpResponse": {
			"status": 500,
			"contentType": "text/plain",
			"contentIndex": "stack"
		}
	},
	{
		"name": "InvalidConfigSchema",
		"extends": Error,
		"super": (arg) => JSON.stringify(arg),
		"httpResponse": {
			"status": 400,
			"contentType": "application/json",
			"contentIndex": "message"
		}
	},
	{
		"name": "FoundDuplicateWebhookItem",
		"extends": Error,
		"super": (arg) => `Webhook name '${arg}' already exist.`,
		"httpResponse": {
			"status": 403,
			"contentType": "application/json",
			"contentIndex": "message"
		}
	},
	{
		"name": "ObjectNotFound",
		"extends": Error,
		"super": (arg) => `Webhook name '${arg}' not found.`,
		"httpResponse": {
			"status": 403,
			"contentType": "application/json",
			"contentIndex": "message"
		}
	},
	{
		"name": "ObjectPathNameMismatch",
		"extends": Error,
		"super": (arg) => `Object url path mismatch to payload (found '${arg}').`,
		"httpResponse": {
			"status": 403,
			"contentType": "application/json",
			"contentIndex": "message"
		}
	},
	{
		"name": "FoundDuplicateServiceId",
		"extends": Error,
		"super": (arg) => `Found multiple service which id '${arg}'.`,
		"httpResponse": {
			"status": 403,
			"contentType": "application/json",
			"contentIndex": "message"
		}
	}
];

for(let i in errDef) {
	let elem = errDef[i];
	let extend = (elem.extends) ? elem.extends : Error;
	Errors[elem.name] = class extends extend {
		constructor(...arg) {
			super(elem.super(...arg));
			this.name = elem.name;
			Error.captureStackTrace(this, this.constructor);
		}
		
		getHttpResponse() {
			let res = Object.assign({}, elem.httpResponse);
			res.content = this[res.contentIndex];
			delete res.contentIndex;
			return res;
		}
	};
}

module.exports = Errors;
