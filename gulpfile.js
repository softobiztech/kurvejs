var gulp = require("gulp");
var uglify = require("gulp-uglify");
var del = require("del");
var typescript = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var merge2 = require("merge2");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var changed = require('gulp-changed');
var runSequence = require('run-sequence');
var config = require("./config.json");
var addModuleExports = require("./gulp-addModuleExports");
var replace = require("gulp-replace");
var headerfooter = require('gulp-headerfooter');
var dts = require('dts-bundle');
var clientFolder='./client/';
var nodeFolder='./dist/';
/*
Compiles all typescript files and creating a declaration file.
*/


gulp.task('clean', function () {
   return del([
    config.build.buildDir,
    clientFolder,nodeFolder,
   './dist-' + config.build.version +'/'
  ]);
  

});

gulp.task('mergefilesClient', function () {
  gulp.src(config.core.typescript,{base:config.build.srcDir})
    .pipe(replace('module kurve {', ''))
    .pipe(replace('} //remove during bundling', ''))
    .pipe(concat('kurve.ts'))
    .pipe(headerfooter.header(config.build.srcDir + 'headerClient.txt'))
    .pipe(headerfooter.footer(config.build.srcDir + 'footerClient.txt'))
    .pipe(gulp.dest(clientFolder )) 
});

gulp.task('mergefilesNode', function () {
  gulp.src(config.core.node,{base:config.build.srcDir})
    .pipe(replace('module kurve {', ''))
    .pipe(replace('} //remove during bundling', ''))
    .pipe(concat('kurve.ts'))
     .pipe(headerfooter.header(config.build.srcDir + 'headerNode.txt'))
    .pipe(headerfooter.footer(config.build.srcDir + 'footerNode.txt'))
    .pipe(gulp.dest(nodeFolder)) 
});

gulp.task('sourcemap',['mergefilesClient'], function () {
 gulp.src(clientFolder + 'kurve.ts')
    .pipe(sourcemaps.init()) // sourcemaps init. currently redundant directory def, waiting for this - https://github.com/floridoo/gulp-sourcemaps/issues/111 
    .pipe(typescript({  
            noExternalResolve: true,  
            target: 'ES5',  
            module:'amd',
            declarationFiles: false, 
            typescript: require('typescript')
    }))
     .pipe(sourcemaps.write("./"))
     .pipe(gulp.dest(clientFolder ))

});

gulp.task('move-html',['clean'], function () {
    var result = gulp.src(['login.html'])
        .pipe(gulp.dest(config.build.buildDir));
    return result;
});


gulp.task('buildClient',['mergefilesClient','sourcemap'], function () {
  var tsResult =gulp.src(clientFolder + 'kurve.ts')
    .pipe(sourcemaps.init()) // sourcemaps init. currently redundant directory def, waiting for this - https://github.com/floridoo/gulp-sourcemaps/issues/111 
    .pipe(typescript({  
            noExternalResolve: true,  
            target: 'ES5',  
            module:'amd',
            declarationFiles: true, 
            typescript: require('typescript')
    }))


    
 return merge2([ 
         tsResult.dts 
             .pipe(concat('kurve'  + config.build.declarationFilename)) 
             .pipe(gulp.dest(clientFolder)), 
         tsResult.js 
             .pipe(gulp.dest(clientFolder)) 
     ]); 
});


gulp.task('copyreference', function () {
  var result = gulp.src('./reference.ts')
        .pipe(gulp.dest(nodeFolder));
  return result; 
  
});
//gulp.task('buildNode2', function () {
//  
//  dts.bundle({
//    name: 'kurve',
//    main: './dist/reference.ts',
//    baseDir: './dist'
//});
//
//});

gulp.task('packNode',['clean','buildNode'], function () {
  return; 
   
});

gulp.task('buildNode',['mergefilesNode'], function () {
  var tsResult =gulp.src([nodeFolder + 'kurve.ts','./reference.ts'])
    .pipe(typescript({  
            noExternalResolve: false,  
            target: 'ES5',  
            module:'commonjs',
            declarationFiles: true, 
            moduleResolution:'node',
            typescript: require('typescript')
    }))



    
 return merge2([ 
         tsResult.dts 
             .pipe(concat('kurve'  + config.build.declarationFilename)) 
             .pipe(gulp.dest(nodeFolder)), 
         tsResult.js 
             .pipe(gulp.dest(nodeFolder)) 
     ]); 
});

gulp.task('packNode',['clean','buildNode2'], function () {
  return; 
   
});

gulp.task('packBrowser',['clean','buildClient'], function () {
  var result = gulp.src(config.build.buildDir + '*.*')
        .pipe(gulp.dest('./dist-' + config.build.version ));
  return result; 
  
});

gulp.task('default',['clean','packNode','packBrowser'], function () {
   var result = gulp.src('./dist-' + config.build.version + "/kurve.js")
   .pipe(rename(config.build.minFilename + '-' + config.build.version + '.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist-' + config.build.version ));
  return result; 
  
});





