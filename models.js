'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var authorSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  userName: { type: String, unique: true}
});

var commentSchema = mongoose.Schema({ content: 'string' });
//const commentsSchema = mongoose.Schema({
//  content: string
//});
const blogPostSchema = mongoose.Schema({
  //authors: [{type:mongoose.Schema.Types.ObjectId, ref: 'Author'}],
  //author: {firstName: String, lastName: String},
  title: {type: String }, //,required: true},
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'Author'},
  content: {type: String},
  created: {type: Date, default: Date.now},
  comments: [commentSchema]//comments: [commentsSchema]
});



//author property is now _id of authors collection so this comes out undefined
//use mongoose middleware function to populate author data before each call to findOne
//prehook lets schema's serialize method access authorName virtual property after findOne call
blogPostSchema.pre('find', function(next){
  this.populate('author');
  next();
});
blogPostSchema.pre('findOne', function(next){
  this.populate('author');
  next();
});
blogPostSchema.virtual('authorName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});
blogPostSchema.methods.serialize = function() {
  return {
    id: this._id,
    author: this.authorName,
    content: this.content,
    title: this.title,
    comments: this.comments,
    created: this.created
  };
};

const Author = mongoose.model('Author', authorSchema);
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = {Author, BlogPost};
