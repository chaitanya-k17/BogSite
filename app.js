const express=require("express");
const bodyParser=require("body-parser");
const https=require("https")
const ejs=require("ejs")
const mongoose=require("mongoose")
const md5 = require("md5");
const session = require("express-session")
const mongoDBSession=require("connect-mongodb-session")(session);
require('dotenv').config()
const multer = require('multer');

const storage = multer.diskStorage({
	destination:function(req,file,cb){
		cb(null,'./public/uploads/')
	},
	filename:function(req,file,cb){
		cb(null,req.session.userId);
	},

});
const upload = multer({storage: storage});

const app=express();
app.set('view engine', 'ejs');
app.use( express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));



//-----------MONGO DB ---------------------------------------------
const mongoosePass=process.env.MDBpswd;

const URI ='mongodb+srv://blogAdmin:'+mongoosePass+'@blogdata.cdg5g.mongodb.net/Blogs?retryWrites=true'
mongoose.connect(URI, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);


const store = new mongoDBSession({
	uri:URI,
	collection: "mySessions",
})

app.use(
	session({
	  secret: 'BlogSite is safe !',
	  resave: false,
	  saveUninitialized: false,
	  store:store ,
	})
);

const isAuth = (req,res,next) => {
	if(req.session.isAuth){
		next();
	}
	else{
		res.redirect("/login");
	}
}



// ----------------------Schema Created------------------------------------

const blogSchema= new mongoose.Schema({
	heading:{
      type: String ,
      required: true,
      unique:true,
    },
	article:{
      type: String,
      required: true,
      minLength:30,
    },
	userid:String,

});


const userSchema= new mongoose.Schema({
	fname:{
		type:String,
		required:true,
		minLength:2
	},
	lname: {
      type: String,
      required: true,
      minLength:2,
    },
    username: {
      type: String ,
      required: true,
      unique:true,
    },
    email: {
      type: String,
      required: true,
      unique:true,
    },
    password:{
      type: String,
      required: true,
      minLength:8,
    },
    // profilepic:{

    // },
	verification:false,
});


const Blog=mongoose.model('Article',blogSchema);

const user=mongoose.model('User',userSchema);










 // ----------------------Entering the Home page----------------------------------
app.get("/profile",function(req,res){


	const myblog=[];

	Blog.find({userid:req.session.userId},function(err,foundarticles){
		if(err){

		}
		else{
			foundarticles.forEach(function(findarticle){
				myblog.push(findarticle)
			});
			user.findById(req.session.userId,function(err,userdetails){
				if(req.session.isAuth){
					res.render('profile',{message:"",articles:myblog,refers:"/logout",refersto:"Logout",user:userdetails})
				}
				else{
					res.redirect("/signup");
				}
			});
		}
	})

})
 // ----------------------Profile page----------------------------------

app.get("/",function(req,res){


	const showBlog=[];

	Blog.find({},function(err,foundarticles){
		if(err){

		}
		else{
			foundarticles.forEach(function(findarticle){
				showBlog.push(findarticle)
			});
			if(req.session.isAuth){
				res.render('home',{message:"",articles:showBlog,refers:"/logout",refersto:"Logout"})
			}
			else{
				res.render('home',{message:"",articles:showBlog,refers:"/signup",refersto:"Signup"})

			}
		}
	})
})

 // ----------------------uploading  the profiepic----------------------------------


app.post("/profilepic",upload.single('profileimg'),(req,res,next)=>{

	console.log(req.file);
	res.redirect("/profile");



});
 // ----------------------deleting the post----------------------------------

app.get("/delete/:id",isAuth,(req,res,next)=>{
	const id=req.params.id;
	Blog.findById(id,function(err,foundarticle){
		if(!foundarticle){
			res.redirect("/profile");
		}
		if(foundarticle.userid==req.session.userId){
			console.log(foundarticle.id);
			Blog.deleteOne({ _id:foundarticle._id },function(err){
				if(err){
					console.log(err);	
				}
			})
			res.redirect("/profile");	   		
	   	}
   		else{
   			res.redirect("/profile");
  		}
   })
});

 // ----------------------Login to Home page----------------------------------
 app.post("/login",async (req,res)=>{

 	if(req.session.isAuth){
		res.render("result",{message:"Please Logout first" ,value:"danger",refer:"/logout",referto:"Logout",refers:"/logout",refersto:"logout"});
	}

 	const useremail=req.body.email
 	const userpassword=req.body.password


 	let olduser = await user.findOne({email:useremail});

 	if(!olduser){
 		res.render("result",{message:"Please Signup first" ,value:"danger",refer:"/login",referto:"login",refers:"/login",refersto:"login"});
 	}

 	const decrypt = md5(userpassword)

 	if( olduser.password!=decrypt){
 		res.render("result",{message:"Password Invalid" ,value:"danger",refer:"/login",referto:"login",refers:"/login",refersto:"login"});
 	}

 	req.session.isAuth=true;
 	req.session.userId=olduser.id
 	console.log(req.session.userId);
 	res.redirect("/");


 });

 // ----------------------Signup to Home page----------------------------------

 app.post("/signup",async (req,res)=>{
 	if(req.session.isAuth){
		res.render("result",{message:"Please Logout first" ,value:"danger",refer:"/logout",referto:"Logout",refers:"/logout",refersto:"logout"});
	}
	const fName=req.body.fname;
 	const lName=req.body.lname;
 	const uName=req.body.uname
 	const useremail=req.body.email;
 	const userpassword=req.body.password;

 	const olduser1= await user.findOne({email:useremail});

 	console.log(olduser1);

 	if(olduser1){
		res.render("result",{message:"Email already exist first" ,value:"danger",refer:"/signup",referto:"signup",refers:"/signup",refersto:"signup"});
 	}

 	 const olduser2= await user.findOne({username:uName});

 	console.log(olduser2);

 	if(olduser2){
		res.render("result",{message:"Email already exist first" ,value:"danger",refer:"/signup",referto:"signup",refers:"/signup",refersto:"signup"});
 	}
 	
 	const encrypt = md5(userpassword)
 	newUser = new user({
 		fname:fName,
 		lname:lName,
 		username:uName,
 		email:useremail,
 		password:encrypt,
 	})

 	await newUser.save(function(err){
 		if(err){
 			console.log(err);
 			res.redirect("/signup");
 		}
 	})

 	res.redirect("/");
 });
// -------------------------Logout the article-----------------------------------------

 app.get("/logout",async (req,res)=>{
 	req.session.destroy((err)=>{
 		if(err)throw err;
 		res.redirect("/login");
 	})
})


// -------------------------Composing the article-----------------------------------------

app.get("/compose",isAuth,(req,res)=>{ 

	res.render('compose',{refers:"/logout",refersto:"Logout"})
})

// -------------------------Saving the composed article------------------------------------

app.post("/compose",isAuth,(req,res)=>{
	//-------------recieved article and Heading
		const rHeading=req.body.heading; 
		const rArticle=req.body.article 
		const rUser= req.session.userId

		console.log(rUser);

		const nblog=new Blog({
			heading:rHeading,
			article:rArticle,
			userid:rUser
		});
		console.log(nblog);
		nblog.save(function(err){
			if(!err){
				res.redirect("/")
			}
			else{
				res.redirect("/compose")
			}
		});
});
// -----------------------Showing  article------------------------------------------------

app.get("/post/:id",isAuth,function(req,res){
	   const id=req.params.id;
	   Blog.findById(id,function(err,foundarticle){
	   		if(foundarticle){
	   			user.findById(foundarticle.userid,function(err,articlewriter){
	   				res.render('post',{article:foundarticle,writerUname:articlewriter.username,refers:"/logout",refersto:"Logout"});
	   			});
	   		}
	   		else{
	   			res.redirect("/");
	   		}
	   })
});
// -----------------------About page------------------------------------------------

app.get("/about",function(req,res){ 

	if(req.session.isAuth){
		res.render('about',{refers:"/logout",refersto:"Logout"})
	}
	else{
		res.render('about',{refers:"/signup",refersto:"Signup"})
	}
})
// -----------------------About page------------------------------------------------

app.get("/profile",function(req,res){ 

	if(req.session.isAuth){
		res.render('profile',{refers:"/logout",refersto:"Logout"})
	}
	else{
		res.render('profile',{refers:"/signup",refersto:"Signup"})
	}
})
// -----------------------Signup page------------------------------------------------

app.get("/signup",function(req,res){ 

	if(req.session.isAuth){
		res.render("result",{message:"Please Logout first" ,value:"danger",refer:"/logout",referto:"Logout",refers:"/logout",refersto:"logout"});
	}
	else{
		res.render('signup',{refers:"/signup",refersto:"Signup"})
	}
})
// -----------------------Login page------------------------------------------------

app.get("/login",function(req,res){ 

	if(req.session.isAuth){
		res.render("result",{message:"Please Logout first" ,value:"danger",refer:"/logout",referto:"Logout",refers:"/logout",refersto:"logout"});
	}
	else{
		res.render('login',{refers:"/signup",refersto:"Signup"})
	}
})


 // ----------------------Subscription  to the Newsletter----------------------------------

const options={
	method : "POST",
	auth:"chaitanya:"+process.env.mchimpAPIKEY
};


app.post("/subscription",function(req,res){
	const fName=req.body.fName;
	const lName=req.body.fName;
	const email=req.body.email;

	const data = {
		email_address:email,
		status: "subscribed",
		merge_fields:{
			FNAME:fName,
			LNAME:lName,
		}
	};
	const url =  "https://us1.api.mailchimp.com/3.0/lists/746432733f/members?"
	const jsonData= JSON.stringify(data);

	const request=https.request(url,options,function(response){

		
		response.on("data",function(data){
			const pending= JSON.parse(data).status;
			if(pending==400){
				res.render("result",{message:"Subscription Failed as " + JSON.parse(data).title ,value:"danger",refer:"/",referto:"Home",refers:"",refersto:""})
			}
			else if(pending=='subscribed'){
				res.render("result",{message:"Subscription Successfull" ,value:"success",refer:"/",referto:"Home",refers:"",refersto:""})
			}
			else{
				res.render("result",{message:"Subscription Failed ,Please retry" ,value:"danger",refer:"/",referto:"Home",refers:"",refersto:""})
			}
		});
	});


	request.write(jsonData);
	request.end();

});




 // ----------------------themes  to the Newsletter----------------------------------

app.get("/themes",isAuth,function(req,res){

	if(req.session.isAuth){
		res.render('themes',{refers:"/logout",refersto:"Logout"})
	}
	else{
		res.render('themes',{refers:"/signup",refersto:"Signup"})
	}
})+



app.listen(process.env.PORT || 3000 ,function(){
})