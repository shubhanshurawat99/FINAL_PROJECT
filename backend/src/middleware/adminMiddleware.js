const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis")


const adminMiddleware = async (req,res,next)=>{

    try{
        const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error("Token is not present");
    }
    
    const token = authHeader.split(' ')[1];
    
    // Rest of your verification logic remains the same
    const payload = jwt.verify(token, process.env.JWT_KEY);
       


        const {_id} = payload;

        if(!_id){
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        if(payload.role!='admin')
            throw new Error("Invalid Token");

        if(!result){
            throw new Error("User Doesn't Exist");
        }

        // Redis ke blockList mein persent toh nahi hai

        const IsBlocked = await redisClient.exists(`token:${token}`);

        if(IsBlocked)
            throw new Error("Invalid Token");

        req.result = result;


        next();
    }
    catch(err){
        res.status(401).send("Error: "+ err.message)
    }

}


module.exports = adminMiddleware;
