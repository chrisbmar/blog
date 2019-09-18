const express = require("express");
const dotenv = require('dotenv').config();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const request = require('request');
const showdown = require('showdown');
const converter = new showdown.Converter();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');

//environment variables
const listId = process.env.LIST_ID;
const apiKey = process.env.API_KEY;
const accessCode = process.env.ACCESS_CODE;
const dbSecret = process.env.DB_SECRET;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: dbSecret,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

//blog post schema
const postSchema = {
  title: String,
  content: String,
  author: String,
  date: String,
  time: Number
};

const Post = mongoose.model("Post", postSchema);

//user schema for logging in an authenticated user
const userSchema = new mongoose.Schema ({
  username: { type: String, require: true, index:true, unique:true, sparse:true },
  password: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/", (req, res) => {
  
  Post.find({}, (err, posts) => {
    res.render("home", {
      posts: posts.reverse(),
      });
  });
});   

//post request to MAILCHIMP's servers
app.post("/", (req, res) => {
  const firstName = req.body.fName;
  const lastName = req.body.lName;
  const email = req.body.email;

  const data = {
      members: [
          {
              email_address: email,
              status: 'subscribed',
              merge_fields: {
                  FNAME: firstName,
                  LNAME: lastName
              }
          }
      ]
  };

  const jsonData = JSON.stringify(data);

  const options = {
      url: `https://us3.api.mailchimp.com/3.0/lists/${listId}`,
      method: 'POST',
      headers: {
          'Authorization': `chris ${apiKey}`
      },
      body: jsonData
  };

  request(options, (error, response, body) => {
      const parsedBody = (JSON.parse(body));
      console.log(parsedBody.errors[0].error);

      //check for errors with user email in post response from Mailchimp.
      //If error exists, pass error message as a variable to failure page.
      const userEmailError = () => {
        if (parsedBody.errors[0].error === `${email} is already a list member, do you want to update? please provide update_existing:true in the request body`) {
          return `${email} Already exists in the newsletter database.`;
        } else if (parsedBody.errors[0].error === 'Please provide a valid email address.') {
          return 'Please provide a valid email address.';
        } else if (parsedBody.errors[0].error === `${email} looks fake or invalid, please enter a real email address.`) {
          return `${email} looks fake or invalid.`;
        }
        return;
      }

      if (error || parsedBody.error_count !== 0) {
          res.render("failure", {
            userEmailError: userEmailError()
          });
      } else {
          if (response.statusCode === 200) {
            res.render("success");
          } else {
            res.render("failure");
          };
      };
  });
}); 

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {

  if (req.body.code === 'test') {
    res.render("success");
  } else if (req.body.code !== accessCode) {
    res.render("failure", {
      userEmailError: 'Access code is not valid.'
    });
  } else {
    User.register({username: req.body.username}, req.body.password, (err, user) => {
      if (err && err.message !== 'A user with the given username is already registered') {
        console.log(err);
        res.redirect("/register"); 
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/compose");
        });
      }
    });
  }

});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {

  User.findOne({username: req.body.username}, (err, result) => {
    if(err || !result) {
      res.redirect("/register");
    } else if (req.body.username === "test@fakeemail.com") {
      res.render("success");
    } else {
    
      const user = new User({
        username: req.body.username,
        password: req.body.password
      });

      req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => { 
              res.redirect("/compose");
            });
        }
      });  

    }
  })
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("/compose", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", (req, res) => {

  const postInMarkdown = req.body.postBody;
  const postToHtml = converter.makeHtml(postInMarkdown);
  // console.log(postToHtml);

  const post = new Post({
    title: req.body.postTitle,
    content: postToHtml,
    author: req.body.postAuthor,
    date: req.body.postDate,
    time: req.body.postReadingTime
  });

  post.save(err => {
    if (!err) {
      res.redirect("/");
    }
  });
});

app.get("/posts/:postId", (req, res) => {
    
  const reqPostId = req.params.postId;
  
  Post.findOne({_id: reqPostId}, (err, post) => {
    if (!err) {
      res.render("post", {
        title: post.title,
        content: post.content
      });
    } else {
      res.render("failure");
    } 
  });

});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.listen(4000, function() {
  console.log("Server started on port 4000");
});
