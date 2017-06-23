/*global module:false*/
module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		// Task configuration.
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			mobileLess: {
				src: ['edit-css/*.less'],
				dest: 'edit-css/concat/common_grunt.less'
			}
		},
		less: {
			development: {
				options: {
					compress: true
				},
				files: {
					"public/stylesheets/style.css": "edit-css/concat/common_grunt.less"
				}
			},
			production: {
				options: {
					compress: true
				},
				files: {
					"public/stylesheets/style.css": "edit-css/concat/common_grunt.less"
				}
			}
		},
		watch: {
			options: {
				livereload: true
			},
			grunt: {
				files: ['Gruntfile.js']
			}, 
			styles: {
				files: [
					'edit-css/*.less'
				],
				tasks: [
					'concat:mobileLess',
					'less'
				],
				options: {
					nospawn: true
				}
			}
		}
	});

	// These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	// Default task.
	grunt.registerTask('default', ['watch']);
};