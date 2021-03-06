var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequelize;

if (env === 'production'){
	
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		dialect: 'postgres'
	});
} else {
	sequelize = new Sequelize('database_development', 'nbkmzjm', 'fish1ing', {
	host:"localhost",
	dialect:'sqlite',
	storage: __dirname + '/data/dev-todo-api.sqlite',
	logging:false
	});
}


var db = {};	
db.assign = sequelize.import(__dirname + '/models/assign.js')
db.assignTracer = sequelize.import(__dirname + '/models/assignTracer.js');
db.taskOption = sequelize.import(__dirname + '/models/taskOption.js');
db.sysObj = sequelize.import(__dirname + '/models/sysObj.js');

db.user = sequelize.import(__dirname + '/models/user.js');
db.token = sequelize.import(__dirname + '/models/token.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.assign.belongsTo(db.user, {
	 onDelete: 'CASCADE'
});
db.user.hasMany(db.assign,{
	 onDelete: 'CASCADE'
});

db.assignTracer.belongsTo(db.assign, {
	 onDelete: 'CASCADE'
});
db.assign.hasMany(db.assignTracer, {
	 onDelete: 'CASCADE'
});

db.assignTracer.belongsTo(db.user);
db.user.hasMany(db.assignTracer);



module.exports = db;