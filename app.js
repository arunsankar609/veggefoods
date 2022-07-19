var createError = require('http-errors');
var express = require('express');

var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db=require('./config/connection')
const multer=require('multer');

 


let helpers = require('handlebars-helpers');

db.connect((err)=>{
  if(err) console.log('connection error'+err)
  else console.log('Database connected')
  })
  
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/user');

var app = express();
var hbs=require('express-handlebars')

var fileUpload=require('express-fileupload')
var session= require('express-session');
const upload=multer()

const HBS = hbs.create({});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


app.set('hbs',hbs.engine({extname:'hbs',
helpers:{
  // Function to do basic mathematical operation in handlebar
  math: function(lvalue, operator, rvalue) {lvalue = parseFloat(lvalue);
      rvalue = parseFloat(rvalue);
      return {
          "+": lvalue + rvalue,
          "-": lvalue - rvalue,
          "*": lvalue * rvalue,
          "/": lvalue / rvalue,
          "%": lvalue % rvalue
      }[operator];
  }
},
 

defaultLayout:'layout',layoutsDir:__dirname+'/views/layout',partialsDir:__dirname+'/views/partials'},))
HBS.handlebars.registerHelper("ifequals",function(v1,v2,options){
  if(v1==v2){
    return options.fn(this)
  }
  return options.inverse(this) 
}),
HBS.handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"key",cookie:{maxAge:6000000}}))

app.use(fileUpload())
app.use('/', usersRouter);
app.use('/user', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
