var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var expValidator = require('express-validator');
var cookieParser = require('cookie-parser');
var debug = require('debug')('http')

var moment = require('moment');
var now = moment();
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
var _ = require('underscore');
var Umzug = require('umzug')






var db = require('./db.js');

var middleware = require('./middleware.js')(db);
var LocalStorage = require('node-localstorage').LocalStorage
localStorage = new LocalStorage('./scratch')

app.use(cookieParser());
// app.use(middleware.logger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
// app.engine('html', require('ejs').renderFile);
app.set('view engine', 'jade');
app.set('views', path.join(__dirname + '/public', 'views'));
app.set("view options", {
	layout: true
});

app.locals.pretty = true;
app.use(express.static(__dirname));
app.use('/users', express.static(__dirname));
app.use(expValidator());



var umzug = new Umzug({
	storage: 'sequelize',

	storageOptions: {
		sequelize: db.sequelize,
		tableName: '_migrations'
	},
	upName: 'up',
	downName: 'down',

	migrations: {
		// The params that gets passed to the migrations.
		// Might be an array or a synchronous function which returns an array.
		params: [db.sequelize.getQueryInterface(), db.sequelize.constructor],
		path: './migrations',
		pattern: /^\d+[\w-]+\.js$/
	}
});


// var serialPort = require('serialport')
// SerialPort = serialPort.SerialPort
// serialPort.list(function(err, ports){
// 	ports.forEach(function(port){
// 		console.log(port.comName)
// 	})
// })

// portName = process.argv[2]
// var myPort = new SerialPort('COM3', {
// 	baudRate: 9600,
// 	parser: serialPort.parsers.readline('\n')
// })

// myPort.on('open', function(){
// 	console.log('port open at: ' + myPort.options.baudRate)
// })

// myPort.on('error', function(error){
// 	console.log('errorx: ' + error)
// })

// myPort.on('data', sendSerial)

// function sendSerial(data){
// 	console.log(data)
// }

io.on('connection', function(socket) {
	console.log('user connect to socket io');

	socket.emit('message', {
		text: 'welcomex to schedule app',
		Note: 'first'
	});

	socket.emit('test', {
		text1: 'testtext',
		Note: 'testNote'
	});


});

app.get('/message', function(req, res){
	res.render('message/messageHome')
	
})

app.get('/test', function(req, res){
	
	// res.send('hey hey')
})

app.get('/getJSONTemp', function(req, res){
	// var temp = 'xx'
	res.json({
		temp:localStorage.getItem('temp'),
		humid:localStorage.getItem('humid'),
		ACstatus:localStorage.getItem('ACstatus'),
		ACmode:localStorage.getItem('ACmode'),
		FanStatus:localStorage.getItem('FanStatus'),
		FanMode:localStorage.getItem('FanMode'),
		sTemp:localStorage.getItem('sTemp')
	})
})

app.get('/tstat', function(req, res){
	
	var temp = localStorage.getItem('temp')
	var humid = localStorage.getItem('humid')
	var ACmode = localStorage.getItem('ACmode')
	var ACstatus = localStorage.getItem('ACstatus')
	var FanStatus = localStorage.getItem('FanStatus')
	var FanMode = localStorage.getItem('FanMode')
	var sTemp = localStorage.getItem('sTemp')

	res.render('tstat/tstatHome',{
		temp:temp,
		humid:humid,
		ACmode:ACmode,
		ACstatus:ACstatus,
		sTemp:sTemp,
		FanMode:FanMode,
		FanStatus:FanStatus
	})
		// mode:req.query.mode,
		// setTemp:req.query.setTemp
	
	
	
	
})

app.post('/postJSONWebSet', function(req, res){
	
	// var mode = req.body.mode
	var webSETACmode = req.body.webSETACmode||localStorage.getItem('ACmode')
	var webSetTemp = req.body.webSetTemp||localStorage.getItem('sTemp')
	var webSETFanMode = req.body.webSETFanMode||localStorage.getItem('FanMode')
	// console.log(mode+sTemp)
	// mode:req.query.mode,
	// setTemp:req.query.setTemp
	
	// localStorage.setItem('mode', mode)
	localStorage.setItem('ACmode', webSETACmode)

	localStorage.setItem('sTemp', webSetTemp)
	localStorage.setItem('FanMode', webSETFanMode)

	res.end();
	
})

app.get('/tstatWebSet', function(req, res){
	var ACmode = localStorage.getItem('ACmode')
	var FanMode = localStorage.getItem('FanMode')||'AUTO'
	var sTemp = ((localStorage.getItem('sTemp')-32)*0.5556).toFixed(1)
	res.send({"ACmode":ACmode,"sTemp":sTemp,"FanMode":FanMode})
})


app.get('/tstatMoni', function(req, res){
	
	var temp = req.query.temp
	var humid = req.query.humid
	temp = ((temp*9/5)+32).toFixed(1)
	var ACmode = req.query.ACmode
	var ACstatus = req.query.ACstatus
	var FanStatus = req.query.FanStatus
	var sTemp = req.query.sTemp
	
	localStorage.setItem('temp', temp)
	localStorage.setItem('humid', humid)
	localStorage.setItem('ACstatus', ACstatus)
	localStorage.setItem('FanStatus', FanStatus)
	// localStorage.setItem('sTemp', sTemp)
	res.send("xx");
})

app.get('/testPost', function(req, res){
	// console.log(req.query.q)
	res.render('tstat/testStat')
})

app.get('/tstaton', function(req, res){
	console.log(req.query.q)
	res.send('Let is:'+req.query.q)
})

app.get('/tstatoff/:param1', function(req, res){
	req.params.param1
	res.send(req.params.param1)
})


app.get('/', function(req, res, next) {

	db.assign.findAll({
		include: [db.user]
	}).then(function(assigns) {
		// next();
		return [assigns, db.user.findAll()];
	}).spread(function(assigns, users) {
		// console.log('suerssssssssss' + JSON.stringify(users));
		// console.log('ggggggggggggg' + JSON.stringify(assigns));
		// console.log('yyyyyyyyyy' + JSON.stringify(dateHeader));
		res.render('index', {
			// users: users,
			// assigns: assigns,
			// dateHeader: dateHeader
		});
	}).catch(function(e) {
		res.render('error', {
			error: "eeeeee" + e.toString()
		});
	});
});


app.post('/sysObjRead', middleware.requireAuthentication, function(req, res){
	var varList = req.body.pData
	
	db.sysObj.findAll({
		where:{
			name: varList
		} 
	}).then(function(sysObjs){
		var sysObjList = {}
		sysObjs.forEach(function(sysObj,i){
		sysObjList[sysObj.name] = sysObj.value
		})
		res.json(sysObjList)
	});
})


app.post('/sysObjUpdate', middleware.requireAuthentication, function(req, res){
	var name = req.body.pData.name
	var value = req.body.pData.value
	// console.log(name+'--'+value)
	db.sysObj.upsert({
			name: name,
			value: value
	}).then(function(created){
		// console.log(created)
		if (created === undefined){
			console.log(value)
			res.json({lockoutDate:value})
		}
	}).catch(function(e){
		console.log(e)
	});
})

app.post('/taskSC', middleware.requireAuthentication, function(req, res){
	var curUser= req.user;
	var eDate = moment(new Date(req.body.sDate)).add(7,'days').format('MM-DD-YYYY')
	var sDate = moment(new Date(req.body.sDate)).format('MM-DD-YYYY')

	db.assign.findAll({
		attributes:['id', 'datePos', 'Memo', 'userId', 'Note'],
		include:[{
			model:db.assignTracer,
			include:[{
				model:db.user
			}]
			
		}],
		where:{
			datePos:{
				$between:[sDate,eDate]
			}
		},
		order:[
				[db.assignTracer,'createdAt', 'DESC']
			]
	}).then(function(assign){
		
		// console.log(JSON.stringify(assign, null, 4))
		res.json({
			assign,
			 curUser
		})
	})
})


app.post('/assignTracerReadUpd', middleware.requireAuthentication, function(req, res) {
	var assignTracerId = req.body.assignTracerId;
	db.assignTracer.update({
		Read:true
	}, {
		where:{id:assignTracerId}
	}).then(function(updated){
		res.json({
			updated:updated
		})
	})
})

app.post('/assignTracerReadDay', middleware.requireAuthentication, function(req, res) {
	var assignId = req.body.assignId;
	var curUserTitle = req.user.title;
	// console.log(assignId)

	db.assign.findOne({
		include: [{
			model:db.assignTracer,
			include:[{
				model:db.user
			}]
		}],
		where: {
				id: assignId
		},
		order:[
				[db.assignTracer,'createdAt', 'DESC']
			]
	}).then(function(assign) {
		// console.log(JSON.stringify(assign, null, 4))
			res.json({
				assign: assign
			});

	}).catch(function(e) {
		console.log(e)
	});
});

app.post('/assignTracerReadWeek', middleware.requireAuthentication, function(req, res){
	var curUser= req.user;
	var eDate = moment(new Date(req.body.sDate)).add(7,'days').format('MM-DD-YYYY')
	var sDate = moment(new Date(req.body.sDate)).format('MM-DD-YYYY')

	db.assign.findAll({
		attributes:['id', 'datePos', 'Memo', 'userId', 'Note'],
		include:[{
			model:db.assignTracer,
			include:[{
				model:db.user
			}]
			
		}],
		where:{
			datePos:{
				$between:[sDate,eDate]
			},
			userId:curUser.id
		},
		order:[
				['datePos'],
				[db.assignTracer,'createdAt', 'DESC']

			]
	}).then(function(assigns){
		
		// console.log(JSON.stringify(assigns, null, 4))
		res.json({
			assigns
		})
	})
})



app.post('/dateSC', middleware.requireAuthentication, function(req, res) {
	var userId = req.body.postdata.userId;
	var dateSC = req.body.postdata.dateSC;
	var taskSC = req.body.postdata.taskSC;
	var memo = req.body.postdata.memo;
	var curUser = req.user

	// console.log('dateSC: '+dateSC)
	if (taskSC=='SELECT' ||taskSC=='NEW'){

	// }else if (userId != curUser.id && (curUser.title != 'Admin' && curUser.title != 'Manager')&& taskSC!="SWIT-R"){
		
	// 	res.json({authorized: false});
	} else {
		db.user.findOne({
			where: {
				id: userId
			}
		}).then(function(user) {
			return [
				db.assign.findOrCreate({
					where: {
						userId: user.id,
						datePos: dateSC
					}
				}),
				user
			];
		}).spread(function(assign, user) {
			// console.log(assign[0]+'--'+assign[1])
			user.addAssign(assign[0]).then(function() {

			});

		// console.log(taskSC)	


			if (taskSC=='DELETE'){
				var updatePara = {
					Note: '',
					Memo: ''
				}
			} else {
				var updatePara = {
					Note: taskSC,
					Memo: memo
				}
			}
			return [
				db.assign.update(
					updatePara
				, {
					where: {
						userId: user.id,
						datePos: dateSC
					}
				}),
				db.user.findOne({
					where:{
						id:curUser.id
					}
				})
				, assign
			];
		}).spread(function(assignUpdated, curUser, assign) {
			// console.log('updateeee new taskSC: ' + JSON.stringify(curUser,null,4));
			var body = {
				Note:taskSC,
				Memo:memo||''
			}

			res.json({
					Note: taskSC
				});
			return db.assignTracer.create(body).then(function(assignTracer){
				curUser.addAssignTracer(assignTracer).then(function(){})
				assign[0].addAssignTracer(assignTracer).then(function(){})

			})


			
		}).catch(function(e) {
			console.log("eeroorr" + e);

			res.render('error', {
				error: e.toString()
			});
		});
	}
});

app.post('/clearEvent', middleware.requireAuthentication, function(req,res){
	var sDate = req.body.sDate
	var eDate = req.body.eDate
	db.assigns.update({
		Read:true
	},{
		where:{

		}
	})
})



app.get('/taskOption', middleware.requireAuthentication, function(req, res){
	var curUserTitle = req.user.title;
	db.taskOption.findAll({
		order: [
			['description']
		]
	}).then(function(taskOption){
		res.json({
			taskOption:taskOption,
			curUserTitle:curUserTitle
		})
	}, function(e){
		res.render('error', {
			error: e.toString()
		})

	})

})


app.post('/taskOption', middleware.requireAuthentication, function(req, res) {
	var description = req.body.taskOption
	var category = req.body.taskCategory
	db.taskOption.findOrCreate({
		where:{
			description:description
		}
	}).spread(function(taskOption, created) {
		return [db.taskOption.update({
			category:category
		}, {
			where:{
				description: description
			}
		}), taskOption]	
	}).spread(function(created, taskOption){
		
		taskOption.category = category
		res.json({
				created,
				taskOption:taskOption
			})
	}).catch(function(e) {
		console.log(e)
		res.render('error', {
			error: e.toString()
		})
	});
});


app.post('/delTaskOption', middleware.requireAuthentication, function(req, res){

	db.taskOption.destroy({
		where: {
			description: req.body.taskOption
		}
	}).then(function(deleted){
		res.json({
			deleted:deleted
		});
	});

})


app.post('/ajaxUser', middleware.requireAuthentication, function(req, res) {

	db.user.findAll({
		where:{
			active:true
		}, 
		order:[
				['title']
				]
		,
	}).then(function(users) {
		res.json({
			pData: {
				users: users
				
			}
		});
	}, function(e) {
		res.render('error', {
			error: e.toString()
		});

	});
})







io.on('connection', function(socket) {
	console.log('user connect to socket io');

	socket.emit('message', {
		text: 'welcomex to schedule app',
		Note: 'first'
	});


});


var user = require('./server/serverUser.js');
// var user = express.static(__dirname + '/server');
app.use('/users', user);


// umzug.up().then(function (migrations) {
// 	console.log(migrations)
//   // "migrations" will be an Array with the names of
//   // pending migrations.
//   	db.sequelize.sync(
// 	{force: false}
// 	).then(function() {
		
// 		http.listen(PORT, function() {
// 			console.log('Helllo Express server started on PORT ' + PORT);
// 		});

// 	});
// });


db.sequelize.sync(
	{force: false}
	).then(function() {
		
		http.listen(PORT, function() {
			console.log('Helllo Express server started on PORT ' + PORT);
		});

	});