module.exports = function(db) {

	return {

		requireAuthentication: function(req, res, next) {
			var token = req.get('Auth');

			db.user.findByToken(token).then(function (user){
				req.user = user;
				next();
			}, function () {
				res.status(401).send();
			});

		},
		logger: function(req, res, next) {
			console.log('request: ' + req.method + ' ' + req.originalUrl + ' ' + new Date());
			next();
		}
	}
};