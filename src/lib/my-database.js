const {Database} = require('gateway-addon');

class myDatabase extends Database {
	
	loadThings() {
		if (!this.conn) { 
			return Promise.reject('Database not open');
		}

		return new Promise((resolve, reject) => {
			this.conn.all(
				'SELECT * FROM things', 
				[],
				(error, rows) => {
					(error) ? reject(error) : (!rows) ? resolve({}) : resolve(rows);
				}
			);
		});
	}

}

module.exports = myDatabase;
