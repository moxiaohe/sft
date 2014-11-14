var exec = require('child_process').exec;
var child,child2,child3;

function svnCommit(opts){
	if(!opts){
		
	}
	child = exec('svn add "monitor.js"',function(error, stdout, stderr){
		exec('svn commit "monitor.js" -m "add vps.js moxiaohe---"', function(){
			if(stderr){
				console.log('stderr: ' + stderr);
				return;
			}
		    if (error !== null) {
		    	console.log('exec error: ' + error);
		    	return;
		    }
		    if(!stderr || !error){
		    	 console.log("svn提交成功！");
		    }
		});
	});
}

module.exports = svnCommit;