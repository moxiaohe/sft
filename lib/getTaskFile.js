var ncp = require('ncp');
var fs = require('fs');
var root = __dirname.replace(/\\lib/, '');

module.exports = function(){
	console.log(root);
	// ncp(source, destination, options, callback)
	console.log(root+'\\assets\\Gruntfile.js');

	ncp(root+'/assets/Gruntfile.js', root, function(err){
		if(err){
			console.error(err);
			return;
		}
		console.log('New Task geted!')
	});

	// fs.readFile(root+'/assets/Gruntfile.js', 'utf-8', function(err, data){
	// 	console.log(data);
	// });

}
