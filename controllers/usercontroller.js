require("dotenv").config();
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");


// const  transporter = nodemailer.createTransport({
//     host: "smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//         user: process.env.MAIL_TRAP_USERNAME,
//         pass: process.env.MAIL_TRAP_PASSWORD
//     }
// });
const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
    service: "Gmail",
    port: 2525,
    auth: {
      user: "aguye.raymond@gmail.com",
      pass: "fwedufqxodiejvem"
    }
  });


// SignUp
const signUp = async(req, res) => {
    try {
        // get all data from the request body
        const { username, email, password } = req.body;
        // check if the entry email exist
        const isEmail = await userModel.findOne( {email} );
        if (isEmail) {
            res.status(400).json({
                message: `User with this email: ${email}; already exist.`
            })
        } else {
            // salt the password using bcrypt
            const saltedRound = await bcrypt.genSalt(10);
            //hash the salted password using bcrypt
            const hashedPassword = await bcrypt.hash( password, saltedRound);

            // create a token
            const token = await jwt.sign( { email}, process.env.JWT_SECRETE, { expiresIn: "59m" } )

            // create a user
            const user = new userModel({
                username,
                email,
                password: hashedPassword
            });

            // send verification email
            const baseUrl = process.env.BASE_URL
            const mailOptions = {
                from: process.SENDER_EMAIL,
                to: email,
                subject: "Verify your account",
                html: `Please click on the link to verify your email: <a href="${baseUrl}/users/verify-email/${ token }">Verify Email</a>`, 
            };

            await transport.sendMail(mailOptions)
    

            //save the user
            const savedUser = await user.save();

            // return a response
            res.status(201).json({
                message: `Check your email: ${savedUser.email} to very your account.`,
                data: savedUser,
                token
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

// verify email
const verifyEmail = async(req, res) => {
    try {
        const { token } = req.params;

        // verify token
        const { email } = jwt.verify( token, process.env.JWT_SECRETE );

        const user = await userModel.findOne({ email });

        // update the user verification
        user.isVerified = true;

        // save the changes
        await user.save();

        // update the user's verification status
        const updateduser = userModel.findOneAndUpdate( {email}, user );

        res.status(200).json({
            message: "User verified successfully",
            data: updateduser,
        })
        // res.status(200).redirect( `${process.env.BASE_URL }/login` );

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

// resend verification
const resendVerificationEmail = async(req, res) => {
   try {
    // get user email from request body
    const { email } = req.body;

    //find user
    const user = await userModel.findOne( { email } );
    if (!user) {
        return res.status(400).json({
            error: "user not found"
        });
    }

    // create a token
    const token = await jwt.sign( { email }, process.env.JWT_SECRETE, { expiresIn: "59m" } );

    // send verification email
    const baseUrl = process.env.BASE_URL
    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "Email verification",
        html: `Please click on the link to verify your email: <a href="http://localhost:1889/api/users/verify-email/${ token }">Verify Email</a>`,
    };

    await transporter.sendMail( mailOptions );

    res.status(200).json({
        message: `Verification email sent successfully to your email: ${user.email}`
    } );

  } catch (error) {
    res.status(500).json({
        message: error.message
    })
  }
}

// sign in
const signIn = async(req, res) => {
    try {
        // extract the user email and password
        const { email, password } = req.body;
        // find user by registered email
        const user = await userModel.findOne( {email} );
        // check if email exist
        if ( !user || !user.isVerified ) {
            res.status(404).json({
                message: `User with this email: ${email} is not found.`
            });
        } {
            // compare user password with the saved password.
            const isPassword = await bcrypt.compare( password, user.password );
            // check for password error
            if (!isPassword){
                res.status(400).json({
                    message: "Incorrect password"
                })
            } else {
                // save the generated token to "token" variable
                const token = await genToken(user);
                // return a response
                res.status(200).json({
                    message: "Sign In successful",
                    token: token
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

// sign out
const signOut = async(req, res) => {
   try {
    // get the token from the authorization head
    const token = req.headers.authorization;

    // find the user by the token
    const user = await userModel.find( { token } );

    if ( !user ) {
        return res.status(401).json( {
            message: "Invalid token"
        } );
    }

    // clear the token
    user.token = '';

    // save the user with the saved token
    // await user.save();

    return res.status(200).json({
        message: "User signed out successfully"
    })

   } catch (error) {
    console.error("Something went wrong", error.message)
    res.status(500).json({
        message: error.message
     })
   }
    
}

//all users
const allUsers = async( req, res ) => {
    try {
        const alUsers = await userModel.find();

        res.status(200).json({
            message: "All users",
            data: alUsers
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}


// to change the user password
const changePasseord = async(req, res) => {
    try {
        const {password} = req.body;
        // const {id} = req.params;
        // const userPassword = await userModel.findById(id);

        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(password, salt)

        const {email} = req.body;
        const existingUser = await userModel.findOne(email)
        const token = existingUser.token
        jwt.verify(token, process.env.JWT_SECRETE, (err, data) => {
            if(err){
                res.json("the link has expired")
            } else {
                return data
            }
        })

        await userModel.findByIdAndUpdate(req.params.id, {password: hash}, {new: true})
        res.status(201).json({
            status: "Successful",
            message: " password successfully changed"
        })
    } catch (error) {
        res.status(500).json({
            status: "Unable to change password",
            message: error.message
        })
    }
}

// to reset the user password
const forgotPassword = async(req, res) => {
    try {
        const {email} = req.body;
        const checkEmail = await userModel.findOne({email: email})
        if (!checkEmail){
            return res.status(400).json({
                message: "No email"
            })
        }

        const myToken = jwt.sign({
            id: checkEmail._id
        }, process.env.JWT_SECRETE, {expiresIn: 300000} )

        const verifyLink = `${req.protocol}://${req.get("host")}/api/changePassword/${checkEmail._id}/${myToken}`;

        const message = `please ${checkEmail.username} kindly use the link to reset your account password; link expires in 1minute ${verifyLink}`;
            emailSender({
                from: process.env.user,
                email: checkEmail.email,
                subject: "reset your password",
                message
            });
            res.status(201).json({
                status: "successful.",
                message: "email has been sent to your email"
            });
            
    } catch (error) {
        res.status(500).json({
            status: "Failed",
            message: error.message
        })
    }
}


const genToken = async ( user ) => {
    const token = await jwt.sign({
        userId: user._id,
        username: user.username,
        email: user.email,
    }, process.env.JWT_SECRETE, {expiresIn: "59m"} )

    return token;
}



module.exports = {
    signUp,
    verifyEmail,
    resendVerificationEmail,
    signIn,
    signOut,
    allUsers,
    changePasseord,
    forgotPassword
}