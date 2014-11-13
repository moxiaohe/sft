var fs = require('fs')
var ir = require('inquirer')
var cp = require('ncp')
var rm = require('rimraf')

module.exports = branch;

function branch() {
    ir.prompt([{
        type: "input",
        name: "name",
        message: "请输入分支版本,(例：1.0): "
    }], function(result) {
        if (result.name) {
            if (!result.name.match(/\d+.\d+/g)) {
                console.log('[!] 只能输入数字和点，且开头必须为数字')
                branch()
            };
            fs.exists(result.name, function(dir) {
                check(dir, result)
            })
        } else {
            console.log('[!] 分支名称不能为空')
            branch()
        }
    })
}


function check(dir, result) {
    if (dir) {
        ir.prompt([{
            type: 'confirm',
            name: 'replace',
            message: '目录 [v'+result.name +'] 已经存在,是否覆盖？',
            default: true
        }], function(answer) {
            if (answer.replace) {
                create('v'+result.name)
            } else {
                console.log('[!] 取消目录创建')
            }
        });
    } else {
        create('v'+result.name)
    }
}


function create(result) {
    var dirs;
    var trunk = '../trunk/'
    var dirname = __dirname.replace(/\\lib/, '')
    var assets = dirname + '/assets/'

    if (fs.existsSync(trunk)) {
        dirs = fs.readdirSync(trunk)
        if (dirs.length == 0) {
            console.log('[!] 此项目为新项目，开始初始化资源文件')
            read(assets, result)
        } else {
            console.log('[!] 此项目非新项目，从trunk获取资源文件')
            read(trunk, result)
        }
    }
}

function read(path, name) {
    var files = fs.readdirSync(path);
    var reg = /\{\{title\}\}/g;
    var regProject = /\{\{project\}\}/g
    rm(name, function() {
        fs.mkdir(name, function() {
            files.forEach(function(filename) {
                var isDir = fs.lstatSync(path + filename).isDirectory();
                if (isDir) {
                    cp(path + filename, name + '/' + filename, {
                        stopOnErr: true
                    }, function(err) {
                        if (err) {
                            return console.log(err)
                        };
                        console.log('[!] 创建' + '资源文件完成')
                    })
                } else {
                    fs.readFile(path + filename, function(err, data) {
                        var html = data.toString().replace(reg, name)
                        if (!fs.existsSync(name + '/' + filename, html)) {
                            fs.writeFile(name + '/' + filename, html, function(err) {
                                console.log('[!] 创建' + filename + '文件完成')
                            })
                        } else {
                            fs.unlink(name + '/' + filename, function() {
                                fs.writeFile(name + '/' + filename, html, function(err) {
                                    console.log('[!] 创建' + filename + '文件完成')
                                })
                            })
                        }
                    })
                }
            })
        })
    })

}
