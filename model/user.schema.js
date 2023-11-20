import { Schema,model } from "mongoose";
import bcrypt from "bcryptjs";
import  jwt  from "jsonwebtoken";
import crypto from 'crypto';


const userSchema = new Schema ({
fullName:{
    type:String,
    required:[true,"Name is required"],
    minLength:[5,"Name must be more than 5 char"],
    maxLength:[50,"Name must be less than 50 char"],
    trim:true,
    lowercase:true,
},
email:{
    type:String,
    required:[true,"email is required"],
    trim:true,
    lowercase:true,
    unique:true,
    match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email'],
},
password:{
    type:String,
    required:[true,"password is required"],
    minLength:[8,"Your password at least more than 8 char"],
    select:false,
},
avatar:{
    public_id:{
        type:String,
    },
    secure_url:{
        type:String,

    }
},
role:{
    type:String,
    enum:["USER","ADMIN"],
    default:"USER",
},
forgotPasswordToken:String,
forgotPasswordExpiry:Date,
subscription:{
    id:String,
    status:String
},
},{
    timestamps:true
})

userSchema.pre("save", async function(next){
    if(!this.isModified('password')){
       return next()
    }
    this.password =await bcrypt.hash(this.password,10)

})

userSchema.methods = {
    generateJWTtoken : async function (){
        return await jwt.sign(
            {id:this._id,email:this.email,subscription:this.subscription,role:this.role},
            process.env.JWT_SECRET,
            {
                expiresIn :process.env.JWT_EXPIRY ,
            }
        )
    },
        comparePassword:async function (plaintextPassword){
            return await bcrypt.compare(plaintextPassword,this.password)
        },
    generateResetPasswordToken: async function(){
        const resetToken = crypto.randomBytes(20).toString('hex');

        this.forgotPasswordToken =crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
        this.forgotPasswordExpiry=Date.now() + 15 * 60 * 1000; //15 min from now

        return resetToken;
    }
}

const User = model("User",userSchema);
export default User ;