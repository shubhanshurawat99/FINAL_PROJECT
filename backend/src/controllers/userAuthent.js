const redisClient = require("../config/redis");
const User =  require("../models/user")
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission")
const register = async (req, res) => {
  try {
    validate(req.body);
    const { password } = req.body;
    
    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = 'user';
    
    const user = await User.create(req.body);
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: 'user' },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
    
    res.status(201).json({
      user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role
      },
      token,
      message: "Registration Successful"
    });
  } catch (err) {
    res.status(400).json({ message: "Error: " + err.message });
  }
};

// const register = async (req,res)=>{
    
//     try{
//         // validate the data;

//         validate(req.body); 
//       const {firstName, emailId, password}  = req.body;

//       req.body.password = await bcrypt.hash(password, 10);
//       req.body.role = 'user'
//     //
    
//      const user =  await User.create(req.body);
//      const token = jwt.sign({_id:user._id , emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
//      const reply = {
//         firstName: user.firstName,
//         emailId: user.emailId,
//         _id: user._id,
//         role:user.role,
//     }
    
//      res.cookie('token',token,{maxAge: 60*60*1000});
//      res.status(201).json({
//         user:reply,
//         message:"Loggin Successfully"
//     })
//     }
//     catch(err){
//         res.status(400).send("Error: "+err);
//     }
// }

const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId) throw new Error("Invalid Credentials");
    if (!password) throw new Error("Invalid Credentials");

    const user = await User.findOne({ emailId });
    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new Error("Invalid Credentials");

    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );

    // Return token in response body instead of cookie
    res.status(200).json({
      user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role
      },
      token, // Send token in response body
      message: "Login Successful"
    });
  } catch (err) {
    res.status(401).json({ message: "Error: " + err.message });
  }
};
// const login = async (req,res)=>{

//     try{
//         const {emailId, password} = req.body;

//         if(!emailId)
//             throw new Error("Invalid Credentials");
//         if(!password)
//             throw new Error("Invalid Credentials");

//         const user = await User.findOne({emailId});

//         const match = await bcrypt.compare(password,user.password);

//         if(!match)
//             throw new Error("Invalid Credentials");

//         const reply = {
//             firstName: user.firstName,
//             emailId: user.emailId,
//             _id: user._id,
//             role:user.role,
//         }

//         const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
//         res.cookie('token',token,{maxAge: 60*60*1000});
//         res.status(201).json({
//             user:reply,
//             message:"Loggin Successfully"
//         })
//     }
//     catch(err){
//         res.status(401).send("Error: "+err);
//     }
// }


// logOut feature

// const logout = async(req,res)=>{

//     try{
//         const {token} = req.cookies;
//         const payload = await jwt.decode(token);


//         await redisClient.set(`token:${token}`,'Blocked');
//         await redisClient.expireAt(`token:${token}`,payload.exp);
//     //    Token add kar dung Redis ke blockList
//     //    Cookies ko clear kar dena.....

//     res.cookie("token",null,{expires: new Date(Date.now())});
//     res.send("Logged Out Succesfully");

//     }
//     catch(err){
//        res.status(503).send("Error: "+err);
//     }
// }
const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(400).send("Token not provided");
    
    const token = authHeader.split(' ')[1];
    const payload = jwt.decode(token);
    
    await redisClient.set(`token:${token}`, 'Blocked');
    await redisClient.expireAt(`token:${token}`, payload.exp);
    
    res.status(200).send("Logged Out Successfully");
  } catch (err) {
    res.status(503).json({ message: "Error: " + err.message });
  }
};


const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}



const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}


module.exports = {register, login,logout,adminRegister,deleteProfile};