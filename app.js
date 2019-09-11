const express = require("express");
const dotenv = require('dotenv').config();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const request = require('request');

const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const listId = process.env.LIST_ID;
const apiKey = process.env.API_KEY;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true});

const postSchema = {
  title: String,
  content: String,
  author: String,
  date: String,
  time: Number
};

const Post = mongoose.model("Post", postSchema);

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

app.get("/compose", (req, res) => {
  res.render("compose");
});

app.get("/success", (req, res) => {
  res.render("success");
});

app.post("/compose", (req, res) => {
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
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
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.listen(4000, function() {
  console.log("Server started on port 4000");
});
