module.exports = function(grunt) {
    var cheerio = require('cheerio')
    var fs = require('fs')
    var path = require('path')
    var cfg = JSON.parse(fs.readFileSync('./package.json'));
    var name = path.basename(path.resolve(__dirname, '../../'));
    var version = cfg.branch;
    var dest = {
        demo: '../../../../codePub/' + name + '/branches/' + version + '/demo',
        project: '../../../../codePub/' + name + '/branches/' + version + '/project'
    };

    /**
     * 找到公共组件的css和js文件,并放入cssArr 和 jsArr数组
     * @type {Array}
     */

    var cssArr = [];
    var jsArr = [];
    (function getHtmls() {
        var files = fs.readdirSync('./');
        var filesArr = [];
        htmlReg = /^[^_].*\.html(?:\?.*|$)/
        files.forEach(function(v, k) {
            if (htmlReg.test(v)) {
                filesArr.push(v);
            };
        })
        return filesArr;
    })()
        .forEach(function(v, k) {
            var $ = cheerio.load(fs.readFileSync(v).toString());
            var dom = $.html();
            var cssReg = /.*components.*\.css$/;
            var jsReg = /.*components.*\.js$/;
            $('link')
                .filter(function() {
                    if (this.attr('href') != undefined) {
                        return !this.attr('href').match(/^http|https/) && (this.attr('rel') == 'stylesheet') && this.attr('href') ? /.css$/.test(this.attr('href')) : false;
                    };
                })
                .each(function(v, k) {
                    if (cssReg.test(this.attr('href'))) {
                        cssArr.push(this.attr('href'))
                    };
                })
            $('script')
                .filter(function() {
                    if (this.attr('src') != undefined) {
                        return !this.attr('src').match(/^http|https/) && (this.attr('type') == 'text/javascript' || !this.attr('type')) && this.attr('src') ? /.js$/.test(this.attr('src')) : false;
                    };
                })
                .each(function(v, k) {
                    if (jsReg.test(this.attr('src'))) {
                        jsArr.push(this.attr('src'))
                    };
                })

        })
    /**
     * 脚本开始
     * @type {[type]}
     */
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        /**
         * 构建在开发文件中的目录
         */
        clean: {
            dirs: {
                src: [dest.demo, dest.project],
                options: {
                    force: true
                }
            }
        },
        cssmin: {
            /**
             * 合并并压缩
             */
            minify: {
                src: cssArr.concat(['css/*.css']),
                dest: dest.project + '/css/' + name + '.min.css'
            }
        },
        /**
         * 如果使用less，
         * @type {Object}
         */
        less: {
            compile: {
                files: {
                    './css/less.css': './css/*.less'
                }
            }
        },
        /**
         * css语法检测,默认不执行，自行添加任务
         */
        csslint: {
            all: ['./css/*.css']
        },
        /**
         * js语法检测,默认不执行，自行添加任务
         */
        jshint: {
            all: ['./js/*.js']
        },

        /**
         * copy任务：按照构建图的规则把本地css下图片，js，images文件夹里的内容复制到即将对接到构建目录的project文件夹里，temp和*.html文件复制到即将对接到构建目录里的demo目录下。
         */
        copy: {
            cssimages: {
                expand: true,
                cwd: './css/images',
                src: ['*'],
                dest: dest.project + '/css/images'
            },
            js: {
                expand: true,
                src: jsArr.concat(['./js/*.js']),
                dest: dest.project + '/js',
                flatten: true,
                filter: 'isFile'
            },
            images: {
                expand: true,
                cwd: './images/',
                src: '**',
                dest: dest.project + '/images/'
            },
            temps: {
                expand: true,
                cwd: './temp/',
                src: '**',
                dest: dest.demo + '/temp/'
            },
            htmls: {
                expand: true,
                src: ['./*.html','./_**'],
                dest: dest.demo,
                options: {
                    process: function(content, filepath) {
                        var $ = cheerio.load(content);
                        try {
                            /**
                             * css合并构建方式。移除所有css链接，并加上最终合并之后的链接
                             */
                            if ($('link').length != 0) {
                                $('link')
                                    .filter(function() {
                                        if (this.attr('href') != undefined) {
                                            return !this.attr('href').match(/^http|https/) && (this.attr('rel') == 'stylesheet') && this.attr('href') ? /.css$|.css\?_component$/.test(this.attr('href')) : false;
                                        };
                                    })
                                    .replaceWith('<link rel="stylesheet" href="../project/css/' + name + '.min.css">')
                            };
                            /**
                             * js非合并，但资源定位
                             */
                            if ($('script').length != 0) {
                                $('script')
                                    .filter(function() {
                                        if (this.attr('src') != undefined) {
                                            return !this.attr('src').match(/^http|https/) && (this.attr('type') == 'text/javascript' || !this.attr('type')) && this.attr('src') ? /.js|.js\?_component$/.test(this.attr('src')) : false;
                                        };
                                    })
                                    .attr('src', function(k, v) {
                                        var reg = /.*components(?=\/).*(\/js\/.*)/
                                        if (v==undefined) {return ''};
                                        if (reg.test(v)) {
                                            return '../project/' + v.replace(reg, '$1');
                                        } else {
                                            return '../project/' + this.attr('src')
                                        }
                                    })
                            }
                            /**
                             * 定位前景非零时图片
                             */
                            if ($('img[src^="images"]').length != 0) {
                                $('img[src^="images"]')
                                    .filter(function() {
                                        if (this.attr('src') != undefined) {
                                            return !this.attr('src').match(/^http|https/)
                                        };
                                    })
                                    .attr('src', function(k,v) {
                                        if (v==undefined) {return ''};
                                        return '../project/' + this.attr('src')
                                    })
                            }
                            /*
                             * 定位写在dom上的style
                             */
                            if ($('*[style]').length != 0) {
                                $('*[style]')
                                    .filter(function() {
                                        return $(this).attr('style').match(/background/g)
                                    })
                                    .css('background', function(k, v) {
                                        if (v==undefined) {return ''};
                                        return 'url(../project' + '/' + $(this).css('background').split('url(')[1]
                                    })
                            }

                            return $.html();
                        } catch (e) {
                            console.log(e.message)
                        }
                    }
                }
            }
        },

        watch: {
            css: {
                files: '../{{title}}/**',
                tasks: ['cssmin', 'copy']
            }
        }
    });
    /**
     * @jshint，js语法检测任务，默认不执行，如果要执行在Task里面加上任务
     * @cssmin, css压缩合并任务，默认执行
     */
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['clean', 'cssmin', 'copy', 'watch']);
}
