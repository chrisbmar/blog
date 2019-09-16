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

const listId = process.env.LIST_ID;
const apiKey = process.env.API_KEY;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.DB_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const postSchema = {
  title: String,
  content: String,
  author: String,
  date: String,
  time: Number
};

const Post = mongoose.model("Post", postSchema);

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
      if (error) {
          res.render("failure");
      } else {
          if (response.statusCode === 200) {
            res.render("success");
          } else {
            res.render("failure");
          };
      };
  });
}); 

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
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
});

app.get("/compose", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.get("/success", (req, res) => {
  res.render("success");
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
