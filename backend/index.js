const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { type } = require("os");
app.use(express.json());
app.use(cors());
// database connection with mongodb
// mongoose.connect('mongodb+srv://vaidik:6573@cluster0.bgnw5ou.mongodb.net/ecommerceDB', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
// .then(() => console.log("✅ MongoDB Connected"))
// .catch((err) => console.error("❌ MongoDB Connection Error:", err));
mongoose.connect('mongodb+srv://vaidik:6573@cluster0.bgnw5ou.mongodb.net/ecommerceDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err));
//api creation
app.get("/",(req,res)=>{
   res.send("Express App is Running");
})

app.listen(port,(error)=>{
        if(!error){
            console.log("server running on Port "+port);
        }
        else{
            console.log("Error : "+error);
        }
})
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req,file,cb) =>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({storage:storage});
// Creating upload endpoint for images
app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
        res.json({
            success:1,
            image_url:`http://localhost:${port}/images/${req.file.filename}`   
        })
})
//schema for creating products
const Product =  mongoose.model("Product",{
    id:{
        type: Number,
        required: true
    },
    name:{
        type: String,
        required:true
    },
    category:{
        type: String,
        required:true
    },
    new_price:{
        type:Number,
        required:true
    },
    old_price:{
        type:Number,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    },
    available:{
        type:Boolean,
        default:true
    },
    image:{
        type:String,
        default:true
    }
})
app.post('/addproduct',async (req,res)=>{
  let products = await Product.find({});
  let id;
  if(products.length>0)
  {
     let last_product_array = products.slice(-1);
     let last_product = last_product_array[0];
     id = last_product.id + 1;
  }
  else
  {
    id = 1;
  }
  const newproduct = new Product({
    id:id,
    name:req.body.name,
    image:req.body.image,
    category:req.body.category,
    new_price:req.body.new_price,
    old_price:req.body.old_price,
  })
  console.log(newproduct);
  await newproduct.save();
  console.log("saved");
  res.json({
    success:true,
    name: req.body.name
  })
})
//creating api for  removing product
 app.post('/removeproduct',async(req,res)=>{
  await Product.findOneAndDelete({id:req.body.id});
  console.log("removed");
  res.json({
    success:true,
    name: req.body.name
  })    
 })
 // creating api for getting all products
 app.get('/allproducts',async(req,res)=>{
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
 })
//schema creating for user model
 const Users = mongoose.model('Users',{
     name:{
        type:String,
     },
     email:{
        type:String,
        unique:true,
     },
    password:{
        type:String,
    },
cartData:{
    type:Object,
},
    date:{
        type:Date,
        default:Date.now,
    }
 })
// Creating endpoint for registering the user 
app.post('/signup',async (req,res)=>{
    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"existing user found with same email id"});
    }
    let cart = {};
    for(let i=0;i<300;i++)
    {
        cart[i] = 0;
    }
    const user = new Users({
        name: req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData: cart,
    })
    await user.save();
    const data = {
        user:{
            id:user.id
        }
    }
    const token  = jwt.sign(data,'secret_ecom');
    res.json({success:true,token});
});
// creating endpoint for the user login
app.post('/login',async(req,res)=>{
      let user = await Users.findOne({email:req.body.email});
      if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare)
        {
            const data = {
                user:{
                    id: user.id,
                }
            }
        const token = jwt.sign(data,'secret_ecom');
        res.json({success:true,token});
        }
      else
      {
        res.json({success:false,errors:"Wrong Password"});
      }
    }
    else{
        res.json({success:false,errors:"wrong email id"});
    }
})
// creating endpoint for new collections
app.get('/newcollectiond',async(req,res)=>{
    let products = await  Product.find({});
    let newcollection = products.length > 8 ? products.slice(1).slice(-8) : products;
    console.log("NewCollection Fetched");
    res.send(newcollection);
});
// creating endpoint for popular in woman section
app.get('/popularinwomen',async (req,res)=>{
      let products = await Product.find({category:"women"});
      let popular_in_woman = products.slice(0,4);
      console.log("Popular in women fetched");
      res.send(popular_in_women);
});
//creating middleware to fetch user 
const fetchUser = async (req,res,next)=>{
    const token = req.header('auth-token');
    if(!token)
    {
        res.status(401).send({errors:"Please Authenticate using valid token "})
    }
    else
    {
      try{
         const data = jwt.verify(token,'secret_ecom');
         req.user = data.user;
         next();
      } catch(error){
             res.status(401).send({errors:"Please autenticate using a valid token"})
      }
    }
  }
//creating endpoints for adding products in cartdata
app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log("Added",req.body.itemId);
   let userData = await Users.findOne({_id:req.user.id});
   userData.cartData[req.body.itemId] += 1;
   await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
   res.send("Added");
})
// creating endpoint to remove from the cartdata
app.post('/removefromcart',fetchUser,async(req,res)=>{
    console.log("removed",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
   if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -= 1;
   await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
   res.send("Removed");
})