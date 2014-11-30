module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		uglify: {
			options: {
				banner: "/* <%= pkg.name %> <%= grunt.template.today('yyyy-mm-dd') %> */\n"
			},
			build: {
				files: {
					"ko-promise.min.js": "ko-promise.js"
				}
			}
		},

		jasmine: {
			pivotal: {
				src: "ko-promise.js",
				options: {
					vendor: ["node_modules/knockout/build/output/knockout-latest.js","node_modules/q/q.js"],
					specs: "tests/*.js"
				}
			}
		},

		jshint: {
			files: ["ko-promise.js"],
			options: {
				eqnull: true,
				curly: true,
				forin: true,
				newcap: true,
				noempty: false,
				plusplus: false,
				quotmark: "double",
				nonew: false,
				unused: true,
				boss: true
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-jasmine");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	
	grunt.registerTask("tests", ["jshint", "jasmine"]);
	grunt.registerTask("default", ["jshint", "jasmine", "uglify"]);
};