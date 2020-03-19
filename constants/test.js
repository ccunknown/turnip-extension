const {Errors} = require('./constants');

try {
	throw(new Errors.DatabaseObjectUndefined(null, `test`));
} catch(err) {
	console.log(err);
	console.log(err.toString());
	console.log(err.stack);
	console.log(`http response : ${JSON.stringify(err.getHttpResponse(), null, 2)}`);
	console.log(`http response content : ${err.getHttpResponse().content}`);
}

