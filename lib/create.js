var fs = require('fs')
var ir = require('inquirer')
var rm = require('rimraf')
var path = require('path')
var dir = __dirname

var exec = require('child_process').exec,
    child;

module.exports = create;

function create() {
    ir.prompt([{
        type: "input",
        name: "name",
        message: "请输入项目名称："
    }], function(result) {
        if (result.name) {
            fs.exists(result.name, function(dir) {
                check(dir, result)
            })
        } else {
            console.log('[!] 项目名称不能为空')
            create()
        }

    })
}

function check(dir, result) {
    if (dir) {
        ir.prompt([{
            type: 'confirm',
            name: 'replace',
            message: '目录 [' + result.name + '] 已经存在,是否覆盖？',
            default: true
        }], function(answer) {
            if (answer.replace) {
                exists(result.name)
            } else {
                console.log('[!] 取消目录创建')
            }
        });
    } else {
        exists(result.name)
        child = exec('svn add '+result.name,function(error, stdout, stderr){
            exec('svn commit -m "FAS：initialise project"' + result.name, function(){
                if(stderr){
                    console.log('stderr: ' + stderr);
                    return;
                }
                if (error !== null) {
                    console.log('exec error: ' + error);
                    return;
                }
                if(!stderr || !error){
                     console.log("[!] SVN项目版本库提交成功！");
                }

                exec('svn commit -m "FAS：initialise project"' + result.name, function(){}
            });
        });
    }
}

function exists(result) {
    if (fs.existsSync(result)) {
        rm(result, function() {
            mkdir(result);

        })
    } else {
        mkdir(result)
    }

}

function mkdir(result) {
    fs.mkdir(result, function(err) {
        if (err) {
            return console.log(err)
        }
        fs.mkdir(result + '/trunk', function() {
            console.log('[!] 创建trunk子目录完成')
        })
        fs.mkdir(result + '/branches', function() {
            console.log('[!] 创建branches子目录完成')
        })
   
        fs.mkdir(result + '/tags', function() {
            console.log('[!] 创建tags子目录完成')
        })


    })
}