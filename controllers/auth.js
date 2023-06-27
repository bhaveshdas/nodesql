// exports.getLogin = (req, res, next) => {
//   let message = req.flash('error');
//   res.render('auth/login', {
//     path: '/login',
//     pageTitle: 'Login',
//     isAuthenticated: false
//   });
// };

// exports.postLogin = (req, res, next) => {
//   User.findByPk('1')
//     .then(user => {
//       req.session.isLoggedIn = true;
//       req.session.user = user;
//       req.session.save(err => {
//         console.log(err);
//         res.redirect('/');
//       });
//     })
//     .catch(err => console.log(err));
// };

// exports.postLogout = (req, res, next) => {
//   req.session.destroy(err => {
//     console.log(err);
//     res.redirect('/');
//   });
// };
const User = require('../models/user');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bhaveshdas543@gmail.com',
    pass: 'uykyavfinohrhyix'
  }
});

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ where :{ email: email }})
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          req.flash('error', 'Invalid email or password.');
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  console.log(password);
  User.findOne({ where :{ email: email } })
    .then(userDoc => {
      if (userDoc) {
        req.flash('error', 'E-Mail exists already, please pick a different one.');
        return res.redirect('/signup');
      }
      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          console.log('h is',hashedPassword);
          const user = new User({
            email: email,
            password: hashedPassword,
          });
                                 
          return user.save()
          .then(user=>{
            user.createCart();
          });
        })
        .then(result =>{
          transporter.sendMail({
            to : email,
            from : 'bhaveshdas543@gmail.com',
            subject : 'Signup successful!',
            html: '<h1> Success</h1>'
          })
          res.redirect('/login');
        })
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next)=>{
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  }
  else{
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset password',
    errorMessage: message
  });
}

exports.postReset = (req, res, next)=>{
crypto.randomBytes(32,(err,buffer)=>{
  if(err){
    console.log(err);
    return res.redirect('/reset');
  }
  const token = buffer.toString('hex');
  User.findOne({email: req.body.email})
  .then(user =>{
    if(!user){
      req.flash('error', 'No account with that email found.');
      return res.redirect('/reset');
    }
    user.resetToken = token;
    return user.save();
  })
  .then(result =>{
    res.redirect('/');
    transporter.sendMail({
      to : req.body.email,
      from : 'bhaveshdas543@gmail.com',
      subject : 'Password Reset',
      html:  `
      <p> You requested a reset of password</p>
      <p> click this <a href="http://localhost:3000/reset/${token}"> link</a> within the next hour</p>
      `
    })
  })
  .catch(err=>{
    console.log(err);
  })
});
};

exports.getNewPassword = (req, res, next)=>{
  const token = req.params.token;
  User.findOne({where:{resetToken:token}}).
  then(user =>{
    let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  }
  else{
    message = null;
  }
  res.render('auth/new-password', {
    path: '/reset',
    pageTitle: 'New password',
    errorMessage: message,
    userId: user.id.toString(), 
    passwordToken: token
  });
  })
  .catch(err =>{
    console.log(err);
  })
  
  
}

exports.postNewPassword = (req,res, next)=>{
  const newPassword = req.body.password;
  const userId  = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({where :{resetToken: passwordToken,id: userId}})
  .then(user =>{
    resetUser = user;
   return bcrypt.hash(newPassword,12)
  })
  .then(hashedPassword =>{
    resetUser.password = hashedPassword;
    resetUser.resetToken = null;
    resetUser.resetTokenExpiration= null;
    return resetUser.save();
  })
  .then(result =>{
    res.redirect('/login');
  })
  .catch(err=>{
    console.log(err);
  })
};

